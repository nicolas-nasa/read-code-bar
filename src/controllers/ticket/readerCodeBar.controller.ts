import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import moment from 'moment-timezone';

import { buildResponse } from '../../helpers';

export default async function readerCodeBar(
    request: Request,
    response: Response,
): Promise<Object | void> {
    try {
        const { id } = request.params;
        const onlyNumbers = /^\d+$/.test(id);

        const typeOfCode = (id: string): string | boolean => {
            const types = [
                id.length === 44 ? 'CODIGO_DE_BARRAS' : 'TAMANHO_INCORRETO',
                id.length === 47 || id.length === 48
                    ? 'LINHA_DIGITAVEL'
                    : 'TAMANHO_INCORRETO',
            ];

            return types.find(index => index !== 'TAMANHO_INCORRETO')
                ? types.find(index => index !== 'TAMANHO_INCORRETO')
                : 'TAMANHO_INCORRETO';
        };




        const checkModule = (id: string): { mod: number, efetivo: boolean } => {
            const moduleNumber = id.substr(2, 1);
            const modules = [
                moduleNumber === '6' ? { mod: 10, efetivo: true } : { mod: 0, efetivo: false },
                moduleNumber === '7' ? { mod: 10, efetivo: false } : { mod: 0, efetivo: false },
                moduleNumber === '8' ? { mod: 11, efetivo: true } : { mod: 0, efetivo: false },
                moduleNumber === '9' ? { mod: 11, efetivo: false } : { mod: 0, efetivo: false },
            ];
            return modules.find(index => index !== { mod: 0, efetivo: false });
        };

        const verifyDigit = (id, position, mod) => {
            id = id.split('');
            id.splice(position, 1);
            const modulteCheck = mod === 10 ? (calculateMod10(id).toString()) : (calculateMod11(id).toString());
            return modulteCheck
        };

        const calculateMod10 = (id) => {
            var i;
            var mult = 2;
            var soma = 0;
            var s = '';

            for (i = id.length - 1; i >= 0; i--) {
                s = (mult * parseInt(id.charAt(i))) + s;
                if (--mult < 1) {
                    mult = 2;
                }
            }
            for (i = 0; i < s.length; i++) {
                soma = soma + parseInt(s.charAt(i));
            }
            soma = soma % 10;
            if (soma != 0) {
                soma = 10 - soma;
            }
            return soma;
        }

        const calculateMod11 = (id) => {
            const sequencia = [4, 3, 2, 9, 8, 7, 6, 5];
            let digit = 0;
            let j = 0;
            let DAC = 0;

            for (var i = 0; i < id.length; i++) {
                let mult = sequencia[j];
                j++;
                j %= sequencia.length;
                digit += mult * parseInt(id.charAt(i));
            }

            DAC = digit % 11;

            if (DAC == 0 || DAC == 1)
                return 0;
            if (DAC == 10)
                return 1;

            return (11 - DAC);
        }

        const typeTicketCheck = (id: string): string | boolean => {
            const types = [
                id.substr(-14) === '00000000000000' ||
                    id.substr(5, 14) === '00000000000000'
                    ? 'CARTAO_DE_CREDITO'
                    : 'BANCO',
                id.substr(0, 1) === '8' && id.substr(1, 1) === '1'
                    ? 'ARRECADACAO_PREFEITURA'
                    : 'BANCO',
                id.substr(0, 1) === '8' && id.substr(1, 1) === '2'
                    ? 'CONVENIO_SANEAMENTO'
                    : 'BANCO',
                id.substr(0, 1) === '8' && id.substr(1, 1) === '3'
                    ? 'CONVENIO_ENERGIA_ELETRICA_E_GAS'
                    : 'BANCO',
                id.substr(0, 1) === '8' && id.substr(1, 1) === '4'
                    ? 'CONVENIO_TELECOMUNICACOES'
                    : 'BANCO',
                id.substr(0, 1) === '8' && id.substr(1, 1) === '5'
                    ? 'ARRECADACAO_ORGAOS_GOVERNAMENTAIS'
                    : 'BANCO',
                id.substr(0, 1) === '8' && id.substr(1, 1) === '6' ? 'OUTROS' : false,
                id.substr(0, 1) === '8' && id.substr(1, 1) === '7'
                    ? 'ARRECADACAO_TAXAS_DE_TRANSITO'
                    : 'BANCO',
            ];

            const typeChecked = types.find(index => index !== 'BANCO') === false
                ? 'BANCO'
                : types.find(index => index !== 'BANCO');


            return typeChecked
        };

        const substringReplace = (str, repl, inicio, tamanho) => {
            if (inicio < 0) inicio = inicio + str.length;
            tamanho = tamanho !== undefined ? tamanho : str.length;
            if (tamanho < 0) {
                tamanho = tamanho + str.length - inicio;
            }

            return [
                str.slice(0, inicio),
                repl.substr(0, tamanho),
                repl.slice(tamanho),
                str.slice(inicio + tamanho)
            ].join('');
        }

        const linhaDigitavel2CodBarras = (id) => {

            const tipoBoleto = typeTicketCheck(id);
            let resultado = '';

            if (tipoBoleto === 'BANCO' || tipoBoleto === 'CARTAO_DE_CREDITO') {
                resultado = id.substr(0, 4) +
                    id.substr(32, 1) +
                    id.substr(33, 14) +
                    id.substr(4, 5) +
                    id.substr(10, 10) +
                    id.substr(21, 10);
            } else {

                id = id.split('');
                id.splice(11, 1);
                id.splice(22, 1);
                id.splice(33, 1);
                id.splice(44, 1);
                id = id.join('');

                resultado = id;
            }

            return resultado;
        }

        const validateTicketDv = (codigo) => {
            codigo = codigo.replace(/[^0-9]/g, '');
            const tipoCodigo = typeOfCode(codigo)
            let tipoBoleto;

            let resultado;

            if (tipoCodigo === 'LINHA_DIGITAVEL') {
                tipoBoleto = typeTicketCheck(codigo);

                if (tipoBoleto == 'BANCO' || tipoBoleto == 'CARTAO_DE_CREDITO') {
                    const bloco = {
                        bloco1: codigo.substr(0, 9) + calculateMod10(codigo.substr(0, 9)),
                        bloco2: codigo.substr(10, 10) + calculateMod10(codigo.substr(10, 10)),
                        bloco3: codigo.substr(21, 10) + calculateMod10(codigo.substr(21, 10)),
                        bloco4: codigo.substr(32, 1),
                        bloco5: codigo.substr(33),
                    }

                    resultado = (bloco.bloco1 + bloco.bloco2 + bloco.bloco3 + bloco.bloco4 + bloco.bloco5).toString();
                } else {
                    const identificacaoValorRealOuReferencia = checkModule(codigo);
                    let bloco: { bloco1: string, bloco2: string, bloco3: string, bloco4: string } = {
                        bloco1: '',
                        bloco2: '',
                        bloco3: '',
                        bloco4: ''
                    }

                    if (identificacaoValorRealOuReferencia.mod == 10) {
                        bloco = {
                            bloco1: codigo.substr(0, 11) + calculateMod10(codigo.substr(0, 11)),
                            bloco2: codigo.substr(12, 11) + calculateMod10(codigo.substr(12, 11)),
                            bloco3: codigo.substr(24, 11) + calculateMod10(codigo.substr(24, 11)),
                            bloco4: codigo.substr(36, 11) + calculateMod10(codigo.substr(36, 11)),
                        }
                    } else if (identificacaoValorRealOuReferencia.mod == 11) {
                        bloco = {
                            bloco1: codigo.substr(0, 11),
                            bloco2: codigo.substr(12, 11),
                            bloco3: codigo.substr(24, 11),
                            bloco4: codigo.substr(36, 11),
                        }

                        const dv = {
                            dv1: parseInt(codigo.substr(11, 1)),
                            dv2: parseInt(codigo.substr(23, 1)),
                            dv3: parseInt(codigo.substr(35, 1)),
                            dv4: parseInt(codigo.substr(47, 1)),
                        }

                        let valid = (calculateMod11(bloco.bloco1) == dv.dv1 &&
                            calculateMod11(bloco.bloco2) == dv.dv2 &&
                            calculateMod11(bloco.bloco3) == dv.dv3 &&
                            calculateMod11(bloco.bloco4) == dv.dv4)

                        return valid;
                    }

                    resultado = bloco.bloco1 + bloco.bloco2 + bloco.bloco3 + bloco.bloco4;
                }
            } else if (tipoCodigo === 'CODIGO_DE_BARRAS') {
                tipoBoleto = typeTicketCheck(codigo);

                if (tipoBoleto == 'BANCO' || tipoBoleto == 'CARTAO_DE_CREDITO') {
                    const DV = verifyDigit(codigo, 4, 11);
                    resultado = codigo.substr(0, 4) + DV + codigo.substr(5);
                } else {
                    const identificacaoValorRealOuReferencia = checkModule(codigo);

                    resultado = codigo.split('');
                    resultado.splice(3, 1);
                    resultado = resultado.join('');

                    const DV = verifyDigit(codigo, 3, identificacaoValorRealOuReferencia.mod);
                    resultado = resultado.substr(0, 3) + DV + resultado.substr(3);

                }
            }

            return codigo === resultado;
        }

        const expirationDate = (id: string): Date | string => {
            const typeTicket = typeTicketCheck(id);
            const typeCode = typeOfCode(id);
            let dataFactor = '';
            const data = moment.tz('1997-10-07 20:54:59.000Z', 'UTC');

            if (typeCode === 'CODIGO_DE_BARRAS')
                typeTicket === 'BANCO' || typeTicket === 'CARTAO_DE_CREDITO'
                    ? (dataFactor = id.substr(5, 4))
                    : (dataFactor = '0');


            if (typeCode === 'LINHA_DIGITAVEL')
                typeTicket === 'BANCO' || typeTicket === 'CARTAO_DE_CREDITO'
                    ? (dataFactor = id.substr(33, 4))
                    : (dataFactor = '0');

            if (dataFactor === '0') {
                return 'No Data';
            }
            data.add(Number(dataFactor), 'days');
            return moment(data).locale('pt-br').format('YYYY-MM-DD')
        };

        const amount = (id) => {
            const typeTicket = typeTicketCheck(id);
            const typeCode = typeOfCode(id);
            const moduleType = checkModule(id).efetivo;
            let amount = '';
            let finalAmount;

            if (typeCode === 'CODIGO_DE_BARRAS') {
                if (typeTicket === 'BANCO' || typeTicket === 'CARTAO_DE_CREDITO') {
                    amount = id.substr(9, 10);
                    finalAmount = amount.substr(0, 8) + '.' + amount.substr(8, 2);
                    let char = finalAmount.substr(1, 1) === '0';
                    if (char) {
                        finalAmount = substringReplace(finalAmount, '', 0, 1)
                        char = finalAmount.substr(1, 1)
                    }
                }
                else {
                    if (moduleType) {
                        amount = id.substr(4, 11);
                        finalAmount = amount.substr(0, 9) + '.' + amount.substr(9, 2);
                        let char = finalAmount.substr(1, 1) === '0';
                        if (char) {
                            finalAmount = substringReplace(finalAmount, '', 0, 1);
                            char = finalAmount.substr(1, 1);
                        }
                    } else {
                        finalAmount = 0;
                    }
                }
            }
            else if (typeCode === 'LINHA_DIGITAVEL') {
                if (typeTicket === 'BANCO' || typeTicket === 'CARTAO_DE_CREDITO') {
                    amount = id.substr(37);
                    finalAmount = amount.substr(0, 8) + '.' + amount.substr(8, 2);
                    let char = finalAmount.substr(1, 1) === '0';
                    if (char) {
                        finalAmount = substringReplace(finalAmount, '', 0, 1);
                        char = finalAmount.substr(1, 1);
                    }
                }
                else {
                    if (moduleType) {
                        amount = id.substr(4, 14);
                        const arAmount = amount.split('')
                        arAmount.splice(7, 1);
                        amount = arAmount.join('');
                        finalAmount = amount.substr(0, 9) + '.' + amount.substr(9, 2);
                        let char = finalAmount.substr(1, 1) === '0';
                        if (char) {
                            finalAmount = substringReplace(finalAmount, '', 0, 1);
                            char = finalAmount.substr(1, 1);
                        }
                    } else {
                        finalAmount = 0;
                    }
                }
            }
            return finalAmount.replace(/^0+/, '');
        };

        if (!onlyNumbers || typeOfCode(id) === 'TAMANHO_INCORRETO' || !validateTicketDv(id))
            return buildResponse(response, {
                body: {
                    error: `have a not accepted format in your ticket ${id}`,
                    status: `${StatusCodes.BAD_REQUEST}`,
                    barCode: id,
                },
                statusCode: StatusCodes.BAD_REQUEST,
            });

        return buildResponse(response, {
            body: {
                status: `${StatusCodes.OK}`,
                amount: await amount(id),
                expirationDate: await expirationDate(id),
                barCode: typeOfCode(id) === 'LINHA_DIGITAVEL' ? linhaDigitavel2CodBarras(id) : id,
            },
            statusCode: StatusCodes.OK,
        });
    } catch (error) {
        console.log(error);
    }
}
