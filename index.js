const puppeteer = require('puppeteer')
const { scrollPageToBottom } = require('puppeteer-autoscroll-down');
const { writeToJSONFile } = require('./write')


/**
 * вычисляет высоту контейнера, в котором лежат комментарии
 * @param {puppeteer.Page} page 
 */
const getContainerHeight = async(page) => {
    const container = await page.evaluate(() => {
        const el = document.querySelector('#comments')
        return el ? el.clientHeight : -1
    } );
    return container;
}


/**
 * собирает массив из содержимого элементов на странице
 * @param {puppeteer.Page} page 
 */

const getComments = async(page) => {
    const comments = await page.evaluate(() => {
        const commentElements = document.querySelectorAll('#comment');
        if (!commentElements.length) {
            return [{user: null, comment: null}];
        } 
        return [...commentElements].map((item) => {
            const userElement = item.querySelector('h3 a span');
            const commentElement = item.querySelector('#content-text');
            const user = userElement ? userElement.textContent.trim() : null;
            const comment = commentElement ? commentElement.textContent.trim() : null;
            return {user, comment};
        })
    });
    
    return comments.filter((item) => item.comment || item.user);
}

/**
 * 
 * @param {string} url 
 */
const stealComments = async(url) => {
    const startDate = Date.now()
    console.info('__START__', {url})
    const browser = await puppeteer.launch({ 
        headless: false, // просто открывает браузер
    });

    const page = await browser.newPage()

    await page.setViewport({ width: 1680, height: 1024 });
    const breakTimer = setTimeout(() => { throw new Error('I Hate Youtube') }, 5000) 
    // ютуб очень часто недозагружает страницу, 
    // если за 5 секунд недозагрузил, дальше можно не ждать - кидать ошибку 
    // с тик-током вроде такого не происходит
    // breakTimer и clearTimeout там можно убрать
    await page.goto(url)
    clearTimeout(breakTimer);
    console.info('Ok. Scrolling started ...')
   
    let time = Date.now()
    let scrollIteration = 0;

    // скроллим до тех пор, пока высота контейнера с комментами растет === комментарии продолжают догружаться
    while (true) {
        scrollIteration++
        const h1 = await getContainerHeight(page)
        await scrollPageToBottom(page, { size: 500 });
        const h2 = await getContainerHeight(page)
        let newTime = Date.now()
        // проверяем, если за 3 секунды высота контейнера не увеличилась,
        // значит, все комменты уже загрузились
        // инога при скролле комменты не успеваю загрузиться, поэтому даеи им 3 сек.
        if (h1 === h2 && newTime - time > 3000) {
            break;
        }
        // обнавляем таймер, если высота изменилась
        if (h1 !== h2) {
            time = newTime;
        }
        console.info({scrollIteration})
    }


    const comments = await getComments(page);
    console.info('comment object is ready. It has length', comments.length, 'comments');

    const commentsForWriting = comments.length ? comments : [{user: 'no users', comment: 'no comments'}]
    await writeToJSONFile(commentsForWriting, url)

    const totalTime = (Date.now() - startDate) / 1000
    console.info('__END__', 'it got', totalTime, 'sec')

    await browser.close()
}


stealComments(process.argv[2])


