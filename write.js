const fs = require('fs');
const path = require('path');


// делает строку пути к файлу: ./comments/<current date>
const getPathName = () => path.resolve(__dirname, 'comments', new Date().toLocaleDateString().replace(/\./g, '_'));

// создает папки
const createDirs = () => {
    const dir = path.resolve(__dirname, 'comments');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    const secondDir = getPathName()
    if (!fs.existsSync(secondDir)) {
        fs.mkdirSync(secondDir);
    }
}

// делает имя файла их id url
const getFileName = (url) => {
    const splitUrl = url.split('watch?v=');
    const pathName = getPathName()
    return `${pathName}/${splitUrl[splitUrl.length-1]}.json`;
}


/**
 * создает итоговый JSON файл
 * @param {{user: string, comment: string}[]} obj 
 */
const writeToJSONFile = async(obj, url) => {
    console.info('writing file...')
    const fileName = getFileName(url)
    createDirs()
    await fs.promises.writeFile(fileName, JSON.stringify(obj, null, 2), (err) => {
        if (err) {
          console.error(err);
          return;
        }
        
        return;
      });
      console.info(`comments are recorded to ${fileName}`);
}


module.exports = {writeToJSONFile}