const axios = require('axios');
const cheerio = require('cheerio');
const { format } = require('date-fns');
const { ko } = require('date-fns/locale');
const iconv = require('iconv-lite');

// 오늘 날짜를 YYYYMMDD 형식으로 가져오는 함수
function getTodayDate() {
    const now = new Date();
    // KST(한국 표준시)는 UTC+9
    const kstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return format(kstDate, 'yyyyMMdd', { locale: ko });
}

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a news request.');

    const dateStr = req.query.date || (req.params.date !== '*' && req.params.date) || getTodayDate();
    const url = `https://news.naver.com/main/list.naver?mode=LSD&mid=sec&sid1=105&date=${dateStr}`;
    
    context.log(`Fetching news from: ${url}`);

    try {
        const response = await axios.get(url, {
            headers: {
                // 네이버 서버는 봇 접근을 막기 위해 User-Agent를 확인합니다.
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            // 네이버는 EUC-KR 인코딩을 사용하므로, arraybuffer로 응답을 받아 직접 변환합니다.
            responseType: 'arraybuffer'
        });

        // EUC-KR 인코딩된 데이터를 UTF-8로 변환합니다.
        const html = iconv.decode(Buffer.from(response.data), 'EUC-KR').toString();
        const $ = cheerio.load(html);
        const items = [];

        // 최신 네이버 뉴스 HTML 구조에 맞게 선택자 수정
        // `ul.type06_headline`과 `ul.type11`은 기사 목록을 담는 컨테이너입니다.
        // `li` 태그는 개별 기사를 나타내며, `dt:not(.photo)`는 이미지가 없는 기사 제목을 찾습니다.
        $('ul.type06_headline li, ul.type11 li').each((index, element) => {
            const $element = $(element);
            const $a = $element.find('dt:not(.photo) a');
            
            if ($a.length > 0) {
                const title = $a.text().trim();
                const link = $a.attr('href');
                
                // 언론사 정보는 `span.writing` 클래스에, 시간은 `span.date` 클래스에 있습니다.
                const press = $element.find('span.writing').text().trim();
                const time = $element.find('span.date').text().trim();
                
                // 기사 링크(link)에서 aid를 추출
                const aidMatch = link.match(/aid=(\d+)/);
                const aid = aidMatch ? aidMatch[1] : null;

                items.push({
                    title,
                    link,
                    press,
                    time,
                    aid
                });
            }
        });
        
        context.log(`Found ${items.length} news articles.`);

        // 성공적으로 데이터를 가져온 경우
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: dateStr, count: items.length, items: items })
        };

    } catch (error) {
        // 오류 발생 시 상세 로그 기록
        context.log.error('Error fetching or parsing news:', error);
        
        // 클라이언트에 500 에러와 함께 상세 오류 메시지 전달
        context.res = {
            status: 500,
            body: JSON.stringify({ 
                error: 'Failed to fetch news. Please check the backend logs.', 
                details: error.message 
            })
        };
    }
};