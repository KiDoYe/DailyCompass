const axios = require('axios');

// 환경 변수에서 NewsAPI 키를 불러옵니다.
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

module.exports = async function (context, req) {
    context.log('NewsAPI 호출을 시작합니다.');

    // v2/everything 대신 v2/top-headlines 엔드포인트 사용
    // top-headlines는 query 파라미터가 필수가 아닙니다.
    const url = `https://newsapi.org/v2/top-headlines?country=kr&apiKey=${NEWSAPI_KEY}`;

    try {
        const response = await axios.get(url);
        
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