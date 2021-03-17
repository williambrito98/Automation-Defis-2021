import json

import pandas as pd

df = pd.read_csv('./TRABALHISTAS.csv', encoding='ANSI', sep=';', dtype='string')
df2 = pd.read_csv('./BALANCETE_BASE.csv', encoding='ANSI', sep=';', header=None,
                  names=["APELIDO", "CONTA_CONTABIL", "DESCRICAO_CONTA", "SALDO_ANTERIOR", "DEBITO", "CREDITO",
                         "SALDO_ATUAL", "TIPO", "CONTA", "DESCRICAO", "REDUZIDA", 'UN'])
df3 = pd.read_csv('./CLIENTES.csv', encoding='ANSI', sep=';', dtype='string')
df = df.fillna('')
df2 = df2.fillna('')
df2 = df2.sort_values(['APELIDO', 'DESCRICAO_CONTA'])
df3 = df3.sort_values(['APELIDO'])
configJson = {x: {'cpf_cnpj': '', 'qtd_empregados_inicio': 0, 'qtd_empregados_fim': 0, 'lucro_contabil': 0,
                  'socios': [], 'saldo_caixa_inicio': 0, 'saldo_caixa_fim': 0, 'total_despesas': 0}
              for x in df3['APELIDO'].values if x != ''}

for index, row in df3.iterrows():
    if configJson.get(row.APELIDO, None):
        configJson.get(row.APELIDO).update({'cpf_cnpj': row.CNPJ.zfill(14)})

for index, row in df.iterrows():
    if configJson.get(row.APELIDO, None):
        configJson.get(row.APELIDO).update({'qtd_empregados_inicio': row.QTD_EMPREGADOS_INICIO})
        configJson.get(row.APELIDO).update({'qtd_empregados_fim': row.QTD_EMPREGADOS_FIM})
    if configJson.get(row.APELIDO_BASE, None):
        configJson.get(row.APELIDO_BASE).get('socios').append(
            {'cpf': row.CPF.zfill(11), 'nome': row.NOME_SOCIO, 'participacao_socio': row.PARTICIPACAO,
             'rendimento': row.RENDIMENTO.strip(' ').replace('-', '').replace(',', '').replace('.', '').zfill(1),
             'prolabore': row.PRO_LABORE.strip(' ').replace('-', '').replace(',', '').replace('.', '').zfill(1),
             'irrf': '0'})

for index, row in df2.iterrows():
    if configJson.get(row.APELIDO, None):
        if row.DESCRICAO_CONTA == 'Resultado - Custos':
            somaValor = int(
                str(configJson.get(row.APELIDO).get('lucro_contabil')).replace('.', '').replace(',', '').
                    replace('-', '').strip(' ').zfill(1))
            configJson.get(row.APELIDO).update(
                {'lucro_contabil': somaValor + int(row.SALDO_ATUAL.replace('.', '').replace(',', '').
                                                   replace('-', '').strip(' ').zfill(1))})
        if row.DESCRICAO_CONTA == 'Contas de Apuração':
            somaValor = int(str(configJson.get(row.APELIDO).get('lucro_contabil')).replace('.', '').replace(',', '').
                            replace('-', '').strip(' ').zfill(1))
            configJson.get(row.APELIDO).update(
                {'lucro_contabil': somaValor + int(row.SALDO_ATUAL.replace('.', '').replace(',', '').
                                                   replace('-', '').strip(' ').zfill(1))})
        if row.DESCRICAO_CONTA == 'Resultado - Receitas':
            somaValor = int(str(configJson.get(row.APELIDO).get('lucro_contabil')).replace('.', '').replace(',', '').
                            replace('-', '').strip(' ').zfill(1))
            configJson.get(row.APELIDO).update(
                {'lucro_contabil': int(row.SALDO_ATUAL.replace('.', '').replace(',', '').
                                       replace('-', '').strip(' ').zfill(1)) - somaValor})
        if row.TIPO == 'Caixas e Bancos':
            somaValor = int(
                str(configJson.get(row.APELIDO).get('saldo_caixa_inicio')).replace('.', '').replace(',', '').
                    replace('-', '').strip(' ').zfill(1))
            configJson.get(row.APELIDO).update(
                {'saldo_caixa_inicio': somaValor + int(
                    row.SALDO_ANTERIOR.replace('.', '').replace(',', '').replace('-', '').strip(' ').zfill(1))})
            somaValor = int(
                str(configJson.get(row.APELIDO).get('saldo_caixa_fim')).replace('.', '').replace(',', '').
                    replace('-', '').strip(' ').zfill(1))
            configJson.get(row.APELIDO).update(
                {'saldo_caixa_fim': somaValor + int(
                    row.SALDO_ATUAL.replace('.', '').replace(',', '').replace('-', '').strip(' ').zfill(1))})
        if row.TIPO == 'Despesas':
            somaValor = int(
                str(configJson.get(row.APELIDO).get('total_despesas')).replace('.', '').replace(',', ''))
            configJson.get(row.APELIDO).update(
                {'total_despesas': somaValor + int(
                    row.SALDO_ATUAL.replace('.', '').replace(',', '').replace('-', '0'))})

configJson = json.dumps(configJson)
with open('./config_2.json', mode='w') as f:
    f.write(configJson)
