module.exports = {
    renameFile: (fs, path, directoryDownload, empresa) => {
        //danilo_rec_defis_2021
        const arrayFiles = fs.readdirSync(directoryDownload);
        arrayFiles.map(item => {
            if (item.includes('ReciboDEFIS')) {
                fs.renameSync(path.join(directoryDownload, item), path.join(directoryDownload, `${empresa}_rec_defis_2021.pdf`))
            } else if (item.includes('DeclaracaoDEFIS')) {
                fs.renameSync(path.join(directoryDownload, item), path.join(directoryDownload, `${empresa}_dec_defis_2021.pdf`))
            }
        })
    }
}