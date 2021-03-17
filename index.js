const path = require('path');
const fs = require('fs');
const pathConfigJson = path.join(__dirname, 'test.json');
const pathJsonErrors = path.join(__dirname, 'errors.json')
const renameFileDownload = require('./helpers').renameFile;
const configJson = JSON.parse(fs.readFileSync(pathConfigJson, { encoding: "UTF-8" }))
const puppeteer = require('puppeteer-core');
const pathDownload = path.join(__dirname, 'downloads');
let cliente;
const buttonsJson = {
    "2": {
        "IEF": "#ctl00_conteudo_TrvDASNn1",
        "MEEPP": "#ctl00_conteudo_TrvDASNt2",
        "ESTBL": "#ctl00_conteudo_TrvDASNn3",
        "CNPJ": "#ctl00_conteudo_TrvDASNt4"
    },
    "3": {
        "IEF": "#ctl00_conteudo_TrvDASNn2",
        "MEEPP": "#ctl00_conteudo_TrvDASNt3",
        "ESTBL": "#ctl00_conteudo_TrvDASNn4",
        "CNPJ": "#ctl00_conteudo_TrvDASNt5"
    }
};

for (let index = 0; index < Object.keys(configJson).length; index++) {
    console.log(Object.keys(configJson)[index])

}

process.exit();



async function run() {
    let browser;
    let page;
    let page_2;
    let lengthTable;
    let original;

    try {

        browser = await puppeteer.launch({
            slowMo: 30,
            executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            defaultViewport: {
                width: 1200,
                height: 1080
            },
            headless: false,
            timeout: 20000,
            args: [
                "--disable-notifications"
            ]
        });

        page = await browser.newPage();

        page.setDefaultNavigationTimeout(60000);
        page.setDefaultTimeout(60000);


        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: pathDownload
        })

        await page.goto('https://cav.receita.fazenda.gov.br/autenticacao/login');
        await page.waitForSelector('#login-dados-certificado > p:nth-child(2) > a');
        await page.click('#login-dados-certificado > p:nth-child(2) > a');
        await page.waitForSelector('#cert-digital > a');
        await page.click('#cert-digital > a');
        for (let index = 0; index < Object.keys(configJson).length; index++) {
            cliente = Object.keys(configJson)[0];
            console.log('cliente: ' + cliente)
            await page.waitForSelector('#btnPerfil');
            await page.click('#btnPerfil');
            if (cliente.cpf_cnpj == '') {
                console.log(Object.keys(configJson)[index] + ' sem CNPJ');
                return false;
            }
            await page.type('#txtNIPapel2', configJson[cliente].cpf_cnpj.toString());
            await page.click('#formPJ > input.submit');
            await page.waitForTimeout(2500);
            await page.evaluate(() => document.querySelector('#btn266 > a').click());

            await page.waitForTimeout(2500);
            const isDefis2018 = await page.$eval('#containerServicos266', item => item.textContent);
            if (!isDefis2018.includes('PGDAS-D e Defis 2018')) {
                console.log(Object.keys(configJson)[0] + ' DEFIS ANTIGO');
                // errorCliente = {
                //     cliente: configJson[cliente]
                // }
                //fs.appendFileSync(pathJsonErrors, JSON.stringify(errorCliente))
                delete configJson[cliente]
                continue
            }
            //const iframe = await page.$eval('iframe', item => item.src);
            page_2 = await browser.newPage();
            page_2.on('dialog', async dialog => {
                console.log(dialog.message());
                await dialog.dismiss();
            });
            await page_2.goto('https://sinac.cav.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/defis.app/entrada.aspx', { waitUntil: 'networkidle0' });
            await page_2.click('#ctl00_conteudo_AnoC_4');
            await page_2.click('#ctl00_conteudo_lnkContinuar');
            await page_2.waitForSelector('#ctl00_MenuApln0 > table > tbody > tr > td > a');
            await page_2.click('#ctl00_MenuApln0 > table > tbody > tr > td > a');
            await page_2.waitForSelector('#ctl00_conteudo_AnoCalendario');
            await page_2.click('#ctl00_conteudo_AnoCalendario').then(item => console.log('retificado'));
            await page_2.click('#ctl00_conteudo_AnoRetCalendario').then(item => console.log('original'));
            await page_2.click('#ctl00_conteudo_lnkContinuar');
            await page_2.waitForSelector('#ctl00_conteudo_TrvDASNt1');
            const numerButtons = await page_2.$$eval('#ctl00_conteudo_TrvDASN > table', item => item.length)
            if (numerButtons == 3) {
                await page_2.click('#ctl00_conteudo_TrvDASNt1');
                await page_2.waitForSelector('#optNao');
                await page_2.click('#optNao')
            }
            await page_2.waitForTimeout(1500);
            await page_2.click(buttonsJson[numerButtons].IEF);
            await page_2.click(buttonsJson[numerButtons].MEEPP);
            await page_2.waitForSelector('#ctl00_conteudo_InfEconEmpConteudo > div:nth-child(1) > input');
            await page_2.type('#ctl00_conteudo_InfEconEmpConteudo > div:nth-child(1) > input', '0')
            await page_2.type('#ctl00_conteudo_InfEconEmpConteudo > div:nth-child(2) > input', configJson[cliente].qtd_empregados_inicio.toString())
            await page_2.type('#ctl00_conteudo_InfEconEmpConteudo > div:nth-child(3) > input', configJson[cliente].qtd_empregados_fim.toString())
            await page_2.type('#ctl00_conteudo_InfEconEmpConteudo > div:nth-child(4) > input', configJson[cliente].lucro_contabil.toString())
            await page_2.type('#ctl00_conteudo_InfEconEmpConteudo > div:nth-child(5) > input', '0')
            await page_2.type('#ctl00_conteudo_InfEconEmpConteudo > div:nth-child(8) > input', '0')
            await page_2.type('#ctl00_conteudo_InfEconEmpConteudo > div:nth-child(9) > input', '0')
            for (let index = 0; index < configJson[cliente].socios.length; index++) {
                await page_2.waitForTimeout(1500);
                await page_2.type(`#ctl00_conteudo_InfEconEmpConteudo > div:nth-child(7) > div:nth-child(${index + 2}) > div.titulo > input.cpf`, configJson[cliente].socios[index].cpf)
                await page_2.type(`#ctl00_conteudo_InfEconEmpConteudo > div:nth-child(7) > div:nth-child(${index + 2}) > div.conteudo > div:nth-child(1) > input`, configJson[cliente].socios[index].rendimento)
                await page_2.type(`#ctl00_conteudo_InfEconEmpConteudo > div:nth-child(7) > div:nth-child(${index + 2}) > div.conteudo > div:nth-child(2) > input`, configJson[cliente].socios[index].prolabore)
                await page_2.type(`#ctl00_conteudo_InfEconEmpConteudo > div:nth-child(7) > div:nth-child(${index + 2}) > div.conteudo > div:nth-child(3) > input`, configJson[cliente].socios[index].participacao_socio.replace('%', ''))
                await page_2.type(`#ctl00_conteudo_InfEconEmpConteudo > div:nth-child(7) > div:nth-child(${index + 2}) > div.conteudo > div:nth-child(4) > input`, configJson[cliente].socios[index].irrf)
                if (configJson[cliente].socios.length != (index + 1)) {
                    await page_2.click('#ctl00_conteudo_InfEconEmpConteudo > div:nth-child(7) > p > a')
                }
            }
            await page_2.click(buttonsJson[numerButtons].ESTBL);
            await page_2.click(buttonsJson[numerButtons].CNPJ);
            await page_2.waitForTimeout(2000);
            await page_2.type(`#ctl00_conteudo_ief${configJson[cliente].cpf_cnpj}Conteudo > div:nth-child(1) > input`, '0');
            await page_2.type(`#ctl00_conteudo_ief${configJson[cliente].cpf_cnpj}Conteudo > div:nth-child(2) > input`, '0')
            await page_2.type(`#ctl00_conteudo_ief${configJson[cliente].cpf_cnpj}Conteudo > div:nth-child(3) > input`, configJson[cliente].saldo_caixa_inicio.toString());
            await page_2.type(`#ctl00_conteudo_ief${configJson[cliente].cpf_cnpj}Conteudo > div:nth-child(4) > input`, configJson[cliente].saldo_caixa_fim.toString());
            await page_2.type(`#txt_item5_interno`, '0');
            await page_2.type(`#txt_item5_import`, '0');
            await page_2.type(`#ctl00_conteudo_ief${configJson[cliente].cpf_cnpj}Conteudo > div:nth-child(6) > input`, '0');
            await page_2.type(`#ctl00_conteudo_ief${configJson[cliente].cpf_cnpj}Conteudo > div:nth-child(7) > input`, '0');
            await page_2.type(`#ctl00_conteudo_ief${configJson[cliente].cpf_cnpj}Conteudo > div:nth-child(8) > input`, '0');
            await page_2.type(`#ctl00_conteudo_ief${configJson[cliente].cpf_cnpj}Conteudo > div:nth-child(9) > input`, '0');
            await page_2.type(`#ctl00_conteudo_ief${configJson[cliente].cpf_cnpj}Conteudo > div:nth-child(10) > input`, '0');
            await page_2.type(`#ctl00_conteudo_ief${configJson[cliente].cpf_cnpj}Conteudo > div:nth-child(11) > input`, configJson[cliente].total_despesas.toString());
            await page_2.click('#ctl00_conteudo_tbloptMundacaEndereco tr:nth-child(3) td:nth-child(2) input');
            await page_2.click('#pnlTemplateMundancaEnderecoCabecTexto center input:nth-child(2)');
            await page_2.click('#ctl00_MenuApln0 > table > tbody > tr > td > a');
            await page_2.waitForSelector('#ctl00_MenuApln1 > table > tbody > tr > td > a');
            await page_2.click('#ctl00_MenuApln1 > table > tbody > tr > td > a')
            await page_2.waitForSelector('#ctl00_MenuApln1 > table > tbody > tr > td > a')
            await page_2.click('#ctl00_MenuApln1 > table > tbody > tr > td > a')
            await page_2.waitForTimeout(2000);
            await renameFileDownload(fs, path, pathDownload, cliente);
            await page_2.click('#ctl00_MenuApln0 > table > tbody > tr > td > a');
            await page_2.waitForTimeout(2000)
            lengthTable = await page_2.$$eval('#ctl00_conteudo_TabDeclaracoes > tbody tr', item => item.length)
            await page_2.waitForTimeout(1000);
            await page_2.click(`#ctl00_conteudo_TabDeclaracoes > tbody tr:nth-child(${lengthTable}) td:nth-child(5) a`);
            await page_2.waitForTimeout(2000);
            await renameFileDownload(fs, path, pathDownload, cliente);
            delete configJson[cliente];
            await page_2.close();
        }
        await browser.close();
        return true
    } catch (error) {
        console.log(error)
        await page.waitForTimeout(5000);
        await browser.close();
        console.log('Tentando Novamente')
        return false;
    }
}

(async () => {
    let tentativas = 0;
    let robo;
    do {
        robo = await run();
        if (robo == false) {
            if (tentativas == 3) {
                fs.appendFileSync(pathJsonErrors, JSON.stringify(configJson[cliente]), { flag: 'a' })
                delete configJson[cliente];
            } else {
                tentativas++;
            }
        } else {
            process.exit();
        }
    } while (robo != true);
})();


