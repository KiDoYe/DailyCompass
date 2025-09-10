const axios = require('axios');
const { format, startOfDay, endOfDay } = require('date-fns');
const { ko } = require('date-fns/locale');

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

module.exports = async function (context, req) {
    context.log('NewsAPI 호출을 시작합니다.');

    const now = new Date();
    // KST(한국 표준시)는 UTC+9
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    
    // 오늘 날짜의 시작과 끝을 ISO 8601 형식으로 변환
    const todayStart = format(startOfDay(kstNow), "yyyy-MM-dd'T'HH:mm:ss", { locale: ko });
    const todayEnd = format(endOfDay(kstNow), "yyyy-MM-dd'T'HH:mm:ss", { locale: ko });

    // 주요 한국 언론사 도메인들을 쉼표로 연결
    const koreanDomains = 'yonhapnews.co.kr,news.sbs.co.kr,chosun.com,joongang.co.kr,donga.com,ytn.co.kr,kbs.co.kr,mbn.co.kr,hani.co.kr,hankyung.com,mk.co.kr';

    // 특정 언론사 도메인에서, 오늘 날짜로, 가장 많은 뉴스를 가져오는 URL
    const url = `https://newsapi.org/v2/everything?domains=${koreanDomains}&from=${todayStart}&to=${todayEnd}&pageSize=100&apiKey=${NEWSAPI_KEY}&language=ko`;

    try {
        const response = await axios.get(url);
        
        if (response.data.articles.length === 0) {
            context.res = {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: [] })
            };
            return;
        }

        const articles = response.data.articles.map(article => ({
            title: article.title,
            link: article.url,
            press: article.source.name,
            time: article.publishedAt
        }));

        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: articles })
        };

    } catch (error) {
        context.log.error('NewsAPI 호출 실패:', error.response ? error.response.data : error.message);
        context.res = {
            status: 500,
            body: JSON.stringify({ 
                error: '뉴스 검색 API 호출 실패',
                details: error.response ? error.response.data : error.message
            })
        };
    }
};