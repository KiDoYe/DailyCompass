const axios = require('axios');

// 환경 변수에서 NewsAPI 키를 불러옵니다.
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

module.exports = async function (context, req) {
    context.log('NewsAPI 호출을 시작합니다.');

    const query = 'IT'; // 검색어를 원하는 주제로 변경하세요.
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${NEWSAPI_KEY}&language=ko`;

    try {
        const response = await axios.get(url);
        
        const articles = response.data.articles.map(article => ({
            title: article.title,
            link: article.url,
            press: article.source.name,
            // NewsAPI는 'publishedAt'을 제공하며, 필요에 따라 포맷을 변환할 수 있습니다.
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