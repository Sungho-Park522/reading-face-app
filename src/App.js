import React, { useState, useCallback, useEffect } from 'react';
// Firebase SDK import
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, doc, getDoc, setDoc, serverTimestamp, query, orderBy, limit, getDocs, deleteDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getStorage, ref, uploadBytes, getDownloadURL,
  listAll, getMetadata, deleteObject
} from "firebase/storage";


// ★★★ API 키 설정 영역 ★★★
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;


// Firebase 앱 초기화 및 서비스 가져오기
let app, db, auth, storage;
if (Object.values(firebaseConfig).every(v => v)) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
      });
    } else {
      app = getApps()[0];
      auth = getAuth(app);
    }
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase configuration is missing. Database features will be disabled in the Preview environment.");
}


// 아이콘 정의
// eslint-disable-next-line no-unused-vars
const UploadCloudIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path></svg>);
const HeartIcon = ({ className, filled }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>);
const UsersIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>);
const ThumbsUpIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M7 10v12"></path><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a2 2 0 0 1 3 1.88V5.88Z"></path></svg>);
const ThumbsDownIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 14V2"></path><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a2 2 0 0 1-3-1.88V18.12Z"></path></svg>);
const LinkIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>);
const PlayCircleIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>);
const RefreshCwIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>);
const GlobeIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>);
const ChevronDownIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"></polyline></svg>);
const LinkedInIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>);
const InstagramIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664-4.771 4.919-4.919 1.266-.058 1.644-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.059-1.281.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.441-.645 1.441-1.44-.645-1.44-1.441-1.44z" /></svg>);

// 다국어 텍스트 객체 (전체)
const translations = {
  ko: {
    languageName: "한국어",
    languageSelectLabel: "언어 변경", languageKorean: "한국어", languageEnglish: "English", languageJapanese: "日本語", languageChinese: "中文", languageSpanish: "Español",
    appTitle: "AI 커플 관상 궁합", appSubtitle: "사진만 올려봐! AI가 두 분의 운명적인 만남, 꿀잼으로 풀어드림! 😉", appDisclaimer: "(재미로 보는 거 알죠? 찡긋~☆)",
    physiognomyIntroTitle: "✨ '관상'이란 무엇일까요?", physiognomyIntroText: "'관상'은 얼굴 생김새를 통해 그 사람의 성격이나 운명을 파악하려는 동양의 전통적인 방법이에요. 이 앱은 재미를 위해 현대적인 AI 기술과 관상의 아이디어를 결합했답니다! 과학적 근거보다는 유쾌한 해석에 집중해주세요!",
    person1Title: "첫 번째 주인공", person2Title: "두 번째 주인공", uploadInstruction: "이목구비가 선명하게 잘 보이는<br/>정면 사진을 올려주세요!",
    uploadButton: "사진 올리기!", fileLoaded: "(로딩 완료!)", analyzeButton: "운명의 궁합 분석 시작!", loadingMessage: "AI가 열일 중! 🔥 거의 다 됐어요!", watchAdButton: "광고 보고 결과 확인! (두근두근)",
    errorMessageDefault: "두 분의 사진을 모두 업로드해주세요. 이목구비가 선명하게 나온 사진일수록 분석이 정확해요!",
    noFaceDetectedError: "앗, 사진에서 얼굴을 찾기 어려워요! 😅 이목구비가 선명하게 나온 정면 사진으로 다시 시도해주시면 더 정확한 관상을 볼 수 있답니다.",
    apiErrorGeneric: "API 요청에 실패했습니다", apiErrorResponseFormat: "AI가 응답을 준비하지 못했어요. 😥 응답 형식이 올바르지 않습니다. 잠시 후 다시 시도해주세요!", apiErrorJsonParse: "앗! AI가 너무 신나서 응답 형식을 살짝 실수했나 봐요. 😂 조금만 기다렸다가 다시 시도해주시면, 이번엔 꼭! 제대로 된 결과를 보여드릴게요!", apiErrorNetwork: "분석 중 얘기치 못한 오류가 발생했어요. 😭 네트워크 상태를 확인하고 다시 시도해주세요!",
    resultTitle: "💖 AI 꿀잼 관상 궁합 결과 💖", personAnalysisTitleSuffix: "님의 관상 총평! 🧐", compatibilityTitle: "두 분의 종합 궁합은 과연?! 💕", scoreUnit: "점!!!",
    scoreDefaultReason: "AI 왈: 이 점수는... 운명입니다! ✨", goodPointsTitle: "이런 점이 완전 찰떡궁합! 👍", improvementPointsTitle: "요것만 조심하면 백년해로 각! ⚠️",
    overallCommentTitle: "✨ AI의 종합 코멘트 ✨", defaultOverallComment: "AI 왈: 두 분, 그냥 결혼하세요! (농담 아님 😉)", adviceTitle: "💡 AI의 핵꿀잼 데이트 비법 전수! 💡",
    shareTwitterButton: "트위터에 공유!", shareFacebookButton: "페북에 공유!", retryButton: "처음부터 다시하기",
    shareLinkedInButton: "링크드인에 공유", shareInstagramButton: "인스타 스토리로!",
    footerText: "© {year} AI 커플 관상 궁합 (꿀잼 총평판). 만든이도 꿀잼! 😉",
    interstitialAdTitle: "잠시만요! 🚀", interstitialAdBody1: "AI가 두 분의 운명적인 만남을 빛의 속도로 분석 중이에요!", interstitialAdBody2: "(이 멋진 화면에 광고가 뿅! 나올 수도 있답니다 😉)", interstitialAdLoadingText: "운명의 데스티니 분석 중...",
    rewardedAdTitle: "✨ 특별한 결과 공개 임박! ✨", rewardedAdBody: "잠시 후 광고가 끝나면, 두 분의 놀라운 궁합 결과가 공개됩니다! (두근두근)", rewardedAdFooter: "광고는 스킵 없이! 곧 결과가 팡파레와 함께 등장! 팡! 🎉",
    placeholderImageText1: "첫+번째+분+사진", placeholderImageText2: "두+번째+분+사진", placeholderImageError: "앗!+사진이...+뿅!",
    adPlaceholderBannerText: "꿀잼+광고+배너", adPlaceholderInterstitialText: "두근두근+전면+광고", adPlaceholderRewardedText: "꿀잼+보상형+광고",
    copyButton: "공유 링크 복사", copySuccessMessage: "공유 링크가 복사되었어요! 친구들에게 마구마구 자랑하세요! 💌", copyErrorMessage: "앗! 클립보드 복사에 실패했어요. 😅",
    shareMessage: "우리의 커플 관상 궁합 결과가 궁금하다면? 클릭해서 확인해봐! 👇",
    resultLoading: "결과를 불러오는 중입니다...", resultNotFound: "앗! 해당 결과를 찾을 수 없어요. 주소가 올바른지 확인해주세요.",
    loadingComments: [
      "오, 이 눈썹... 심상치 않은데요? 🤔",
      "두 분의 콧대가 예술이군요. 잠시 감상 좀...👃",
      "AI 눈동자 스캔 중... 또렷한 눈빛 발견! ✨",
      "입꼬리가 닮았네요! 이건 운명일지도? 🤭",
      "잠시만요, 이마에서 빛이... 광채 분석 중! 💡"
    ],
    aiPrompt: {
      instruction: "먼저, 주어진 두 이미지에 선명한 사람의 얼굴이 각각 포함되어 있는지 확인해주세요. 만약 한쪽이라도 얼굴이 아니거나, 얼굴을 인식하기 어렵다면, 다른 필드는 모두 비워두고 JSON 객체에 'error': 'NO_FACE_DETECTED' 필드만 포함하여 응답해주세요. 두 사진 모두에 얼굴이 선명하게 보인다면, 'error' 필드 없이 아래의 지시에 따라 분석을 진행해주세요. \n\n 두 분의 사진이 주어집니다. 각 인물의 전체적인 인상과 성격을 아주 재치 있고 성숙한 유머를 섞어, 마치 '인생 N회차 옆집 형/언니'가 핵심만 콕콕 짚어주듯 분석해주세요. 이때, 각 인물의 **가장 특징적인 이목구비 1~2가지만** 골라서, 그 관상학적 의미를 '아하!' 무릎을 탁 치게 만드는 비유나 유머로 풀어내고, 이것이 전체적인 성격 및 인생관과 어떻게 연결되는지 알려주세요. \"자, 어디 한번 볼까? 이분은 딱 보아하니~\" 같은 느낌으로요. 이 내용을 'overall_impression' 필드에 담아주세요. 분량은 각 사람당 3-4문장 정도로, 너무 가볍지도 무겁지도 않게! 그 후, 두 분의 궁합을 분석해주세요. 궁합 점수(0-100점)와 그 이유를 설명할 때는 \"긴장하시고~ 오늘의 커플 궁합 점수는 바로바로~!\" 처럼 기대감을 주면서도, 결과에 대해서는 '뼈 때리는' 한마디를 덧붙여주세요. 잘 맞는 점('good_points')과 서로 노력하면 좋을 점('areas_for_improvement')은 각각 2가지씩, 마치 '연애 고수'가 현실적인 팩폭과 따뜻한 응원을 동시에 날려주듯 작성해주세요. 예를 들어, '이것만 잘하면 할리우드 커플? 저리 가라 할 케미 폭발 각!' 이런 식으로요. 궁합 총평('overall_summary')은 한 편의 반전 있는 단편 영화 시놉시스처럼, 혹은 다음 화가 궁금해지는 인기 드라마의 명대사처럼 임팩트 있게 요약해주세요. 마지막으로 'advice' 필드에는 두 분이 함께하면 '이런 미친 짓까지 가능하다고?' 싶을 정도로 기상천외하고 재미있는 데이트 아이디어나, '이거 완전 우리 얘기잖아?' 싶은 관계 꿀팁 2가지를 제안해주세요. 모든 텍스트는 핵심을 찌르는 이모티콘(😏, 🔥, 🤣, 💡 등)을 적절히 사용하여 더욱 생동감 있게 만들어주세요!",
      jsonFormatInstruction: "답변은 다음 JSON 형식으로 제공해주세요:", person1NameExample: "첫 번째 분 별명 (예: 예측불가 자유영혼)", person1ImpressionExample: "오호~ 첫 번째 분, 딱 보니 보통내기가 아니시군요! 😏 자유분방함이 물씬 풍기는 눈빛과 살짝 올라간 입꼬리는 '내 사전에 불가능이란 없다!'를 외치는 듯한데요? 특히, 그 어디에도 얽매이지 않을 듯한 이마 라인은 '인생은 한 번뿐!' YOLO 정신을 제대로 보여줍니다. 덕분에 주변에 늘 신선한 영감을 주지만, 가끔 너무 즉흥적이라 '어디로 튈지 모르는 탱탱볼' 같다는 소리 좀 듣겠어요! 🤣", person2NameExample: "두 번째 분 별명 (예: 반전매력 철벽수비수)", person2ImpressionExample: "두 번째 분은 겉으로는 '접근금지' 아우라를 풍기는 철벽수비수 같지만, 알고 보면 속정이 깊은 반전매력의 소유자시네요! 🧐 반듯한 콧날과 다부진 입매는 '한번 마음먹은 건 끝까지 간다!'는 의지를 보여주지만, 의외의 순간에 보여주는 따뜻한 눈빛이 이분의 진짜 매력 포인트! 🔥 신중함도 좋지만, 가끔은 그 철벽, 살짝 내려놓고 달려보는 용기도 필요할 때가 있답니다!", compatibilityScoreReasonExample: "🎉 두구두구~ 이 커플, 궁합 점수는 무려 88점! 이거 완전 '환장의 커플'에서 '환상의 커플'로 진화 직전인데요?! 💕 서로 다른 매력이 만나 예상치 못한 시너지를 뿜어내는, 그야말로 '단짠단짠' 조합이랍니다! (근데 가끔 너무 짜거나 달아서 속 쓰릴 수 있음 주의! 😉)", goodPoint1Example: "첫 번째 분의 '일단 저지르고 보자!' 정신과 두 번째 분의 '돌다리도 부숴버릴 기세로 두드려보자!' 정신이 만나면? 세상에 없던 창조적인 결과물이 뙇! 어쩌면 세상을 바꿀지도? 💡", goodPoint2Example: "서로의 '덕질' 영역을 존중하다 못해 함께 빠져들다 보면, '어? 내가 이런 걸 좋아했었나?' 싶은 신세계를 경험하며 관계의 깊이가 남달라질 거예요! (단, 통장 잔고는 책임 못 짐 🤣)", improvementPoint1Example: "가끔 첫 번째 분이 너무 앞서나가서 두 번째 분이 '저기요, 잠깐만요!'를 외치기도 전에 저만치 가버리거나, 두 번째 분이 너무 신중해서 첫 번째 분이 '아, 속 터져! 내가 그냥 할게!'를 시전할 수 있어요. 서로의 '속도 조절' 능력 만렙 찍기가 시급합니다! 🚀", improvementPoint2Example: "표현 방식이 너무 달라서 '화성에서 온 남자, 금성에서 온 여자' 시즌2 찍을 뻔! 할 때가 있을 거예요. '척하면 척'도 좋지만, 가끔은 '말로 해야 압니다, 네?' 스킬도 장착해야 서로 오해 없이 오래오래 행복할 수 있어요! 💬", overallSummaryExample: "이 커플, 한마디로 '예측불가 롤러코스터'입니다! 🎢 조용할 날 없이 티격태격하면서도 서로 없이는 못 사는, 그런 애증(?)의 관계랄까요? 하지만 분명한 건, 두 분의 삶은 서로로 인해 훨씬 더 다채롭고 유쾌해질 거라는 사실! 지루함은 저 멀리 안드로메다로 보내버리고, 이 스릴 넘치는 여정을 마음껏 즐겨보시길! 🔥", advice1Example: "둘만의 '아무 말 대잔치 데이트'는 어때요? 하루 동안 서로에게 떠오르는 아무 말이나 필터 없이 던져보는 거예요! (단, 끝나고 뒤끝 없기! 🤙) 의외의 진심이나 빵 터지는 유머를 발견할지도 몰라요!", advice2Example: "서로의 '흑역사 배틀'을 열어보세요! 가장 창피했던 과거 사진이나 에피소드를 공유하며 누가 더 강력한 흑역사를 가졌는지 겨뤄보는 거죠! 웃다가 눈물 콧물 다 쏟아도 책임 안 집니다! 😂 이 과정을 통해 서로의 인간적인 매력에 더 깊이 빠져들 거예요!", languageInstructionSuffix: "모든 설명은 선택된 언어(한국어)로 매우 친근하고 재미있게, 유머와 긍정적인 에너지를 담아 작성해주세요."
    }
  },
  en: {
    languageName: "English",
    languageSelectLabel: "Language", languageKorean: "한국어", languageEnglish: "English", languageJapanese: "日本語", languageChinese: "中文", languageSpanish: "Español",
    appTitle: "AI Couple Physiognomy", appSubtitle: "Just upload your photos! AI will hilariously analyze your fateful encounter! 😉", appDisclaimer: "(Just for fun, you know? Wink~☆)",
    physiognomyIntroTitle: "✨ What is 'Physiognomy'?", physiognomyIntroText: "'Physiognomy' is a traditional Eastern method of understanding a person's personality or destiny through their facial features. This app combines the idea of physiognomy with modern AI for fun! Please focus on the lighthearted interpretations rather than scientific evidence!",
    person1Title: "First Person", person2Title: "Second Person", uploadInstruction: "Please upload a clear frontal photo<br/>where facial features are visible!",
    uploadButton: "Upload Photo!", fileLoaded: "(Loaded!)", analyzeButton: "Start Destiny Analysis!", loadingMessage: "AI is working hard! 🔥 Almost there!", watchAdButton: "Watch Ad to See Results! (Exciting)",
    errorMessageDefault: "Please upload photos for both people. The clearer the facial features, the more accurate the analysis!",
    noFaceDetectedError: "Oops, it's hard to find a face in the photo! 😅 For a more accurate reading, please try again with a clear frontal photo where facial features are visible.",
    apiErrorGeneric: "API request failed", apiErrorResponseFormat: "The AI couldn't prepare a response. 😥 The response format is incorrect. Please try again later!", apiErrorJsonParse: "Oops! The AI got a bit too excited and made a little mistake with the response format. 😂 If you wait a moment and try again, we'll get you the proper results this time!", apiErrorNetwork: "An unexpected error occurred during analysis. 😭 Please check your network connection and try again!",
    resultTitle: "💖 AI Fun Physiognomy Compatibility Results 💖", personAnalysisTitleSuffix: "'s Physiognomy Overview! 🧐", compatibilityTitle: "What about your overall compatibility?! 💕", scoreUnit: " Points!!!",
    scoreDefaultReason: "AI says: This score... is destiny! ✨", goodPointsTitle: "You're a perfect match in these aspects! 👍", improvementPointsTitle: "Be careful with these to live happily ever after! ⚠️",
    overallCommentTitle: "✨ AI's Overall Comment ✨", defaultOverallComment: "AI says: You two, just get married! (Not kidding 😉)", adviceTitle: "💡 AI's Super Fun Date Tips! 💡",
    shareTwitterButton: "Share on Twitter!", shareFacebookButton: "Share on Facebook!", retryButton: "Start Over",
    shareLinkedInButton: "Share on LinkedIn", shareInstagramButton: "Share on Instagram!",
    footerText: "© {year} AI Couple Physiognomy (Fun Edition). The creator had fun too! 😉",
    interstitialAdTitle: "Just a moment! 🚀", interstitialAdBody1: "AI is analyzing your fateful encounter at the speed of light!", interstitialAdBody2: "(An ad might pop up on this cool screen 😉)", interstitialAdLoadingText: "Analyzing destiny...",
    rewardedAdTitle: "✨ Special results revealing soon! ✨", rewardedAdBody: "After the ad, your amazing compatibility results will be revealed! (Thrilling)", rewardedAdFooter: "Don't skip the ad! The results will appear with a fanfare! Ta-da! 🎉",
    placeholderImageText1: "Person+1+Photo", placeholderImageText2: "Person+2+Photo", placeholderImageError: "Oops!+Photo...Poof!",
    adPlaceholderBannerText: "Fun+Ad+Banner", adPlaceholderInterstitialText: "Exciting+Interstitial+Ad", adPlaceholderRewardedText: "Fun+Rewarded+Ad",
    copyButton: "Copy Share Link", copySuccessMessage: "Share link copied! Show it off to your friends! 💌", copyErrorMessage: "Oops! Failed to copy to clipboard. 😅",
    shareMessage: "Curious about our couple physiognomy results? Click to see! 👇",
    resultLoading: "Loading results...", resultNotFound: "Oops! Could not find the result. Please check the URL.",
    loadingComments: [
      "Hmm, those eyebrows... quite intriguing! 🤔",
      "Such artistic nose bridges! Let me admire them for a moment... 👃",
      "Scanning with my AI eyes... found a sharp gaze! ✨",
      "The corners of your mouths are similar! Could this be fate? 🤭",
      "Hold on, there's a glow from the forehead... analyzing radiance! 💡"
    ],
    aiPrompt: {
      instruction: "First, please verify that each of the two provided images contains a clear human face. If either image does not contain a recognizable face, please return a JSON object with only an 'error': 'NO_FACE_DETECTED' field, leaving all other fields empty. If both photos clearly show faces, proceed with the analysis as instructed below, without the 'error' field.\n\nYou will be given two photos. Analyze each person's overall impression and personality with witty and mature humor, as if a 'wise older friend' is giving a spot-on analysis. Pick **only 1-2 most distinctive facial features** for each person and explain their physiognomic meaning with clever analogies or humor, connecting it to their overall personality and outlook on life. Use a tone like, \"Alright, let's see... This person is clearly...\" for the 'overall_impression' field. The length should be about 3-4 sentences per person, striking a balance between lighthearted and serious. Then, analyze their compatibility. When explaining the compatibility score (0-100) and its reason, build anticipation like, \"And now, for the moment of truth! Your compatibility score is...!\" and add a punchy one-liner about the result. List two 'good_points' and two 'areas_for_improvement' as if a 'dating guru' is giving both realistic feedback and warm encouragement. For example, 'If you master this, your chemistry will be off the charts, making Hollywood couples jealous!' The 'overall_summary' should be impactful, like a synopsis for a short film with a twist or a memorable line from a popular drama that leaves you wanting more. Finally, in the 'advice' field, suggest two quirky and fun date ideas or relationship tips that are so relatable they'll think, 'This is totally us!'. Use emojis (😏, 🔥, 🤣, 💡, etc.) appropriately to make all text more lively!",
      jsonFormatInstruction: "Please provide the answer in the following JSON format:", person1NameExample: "Person 1 Nickname (e.g., Unpredictable Free Spirit)", person1ImpressionExample: "Oh my, Person 1 is clearly no ordinary individual! 😏 The freewheeling gaze and slightly upturned lips seem to scream, 'Nothing is impossible for me!' Especially that forehead, which looks like it's bound by nothing, truly embodies the 'YOLO' spirit. They bring fresh inspiration to those around them, but their occasional spontaneity might earn them the reputation of being an 'unpredictable bouncing ball'! 🤣", person2NameExample: "Person 2 Nickname (e.g., Stoic Defender with a Twist)", person2ImpressionExample: "Person 2 may seem like a stoic defender with a 'keep out' aura, but they're a person of deep affection with a hidden charm! 🧐 The straight nose and firm lips show a determination to see things through, but the warmth in their eyes, revealed in unexpected moments, is their real charm! 🔥 While caution is good, sometimes they need the courage to lower that guard and just go for it!", compatibilityScoreReasonExample: "🎉 Drumroll, please! This couple's compatibility score is a whopping 88! They're on the verge of evolving from a 'crazy couple' to a 'fantastic couple'! 💕 It's a 'sweet and salty' combination where different charms meet to create unexpected synergy! (But be warned, it might get too salty or sweet at times! 😉)", goodPoint1Example: "When Person 1's 'act first, think later' spirit meets Person 2's 'I'll test the ground until it breaks' mentality? A groundbreaking, creative outcome! Who knows, it might even change the world? 💡", goodPoint2Example: "When you not only respect but also dive into each other's 'fandoms,' you'll discover a whole new world, thinking, 'Huh? I liked this?' This will deepen your relationship in unique ways! (Disclaimer: we are not responsible for your bank balance 🤣)", improvementPoint1Example: "Sometimes Person 1 might get so far ahead that Person 2 is left behind yelling, 'Hey, wait a minute!' Or Person 2 might be so cautious that Person 1 exclaims, 'Ugh, I'll just do it myself!' You urgently need to level up your 'pacing' skills! 🚀", improvementPoint2Example: "Your expression styles are so different you might feel like you're in a sequel to 'Men Are from Mars, Women Are from Venus.' While unspoken understanding is great, you'll need to equip the 'You need to say it out loud' skill to avoid misunderstandings and be happy for a long, long time! 💬", overallSummaryExample: "In one word, this couple is an 'unpredictable rollercoaster'! 🎢 Never a dull moment, always bickering but can't live without each other. But one thing is for sure, your lives will be much more colorful and joyful because of each other! Send boredom to Andromeda and enjoy this thrilling journey to the fullest! 🔥", advice1Example: "How about a 'Gibberish Date'? For one day, say whatever comes to your mind without any filter! (No hard feelings afterward! 🤙) You might discover unexpected truths or hilarious jokes!", advice2Example: "Hold a 'Cringey Past Battle'! Share your most embarrassing old photos or stories and compete to see who has the more cringeworthy past! We're not responsible if you laugh so hard you cry! 😂 This will help you fall deeper for each other's human side!", languageInstructionSuffix: "All descriptions should be written in the selected language (English) in a very friendly, fun, humorous, and positive tone."
    }
  },
  ja: {
    languageName: "日本語",
    languageSelectLabel: "言語", languageKorean: "한국어", languageEnglish: "English", languageJapanese: "日本語", languageChinese: "中文", languageSpanish: "Español",
    appTitle: "AIカップル観相占い", appSubtitle: "写真をアップするだけ！AIが二人の運命的な出会いを面白おかしく分析します！😉", appDisclaimer: "（お遊びだってこと、わかってますよね？キラッ☆）",
    physiognomyIntroTitle: "✨「観相」とは？", physiognomyIntroText: "「観相」とは、顔つきからその人の性格や運命を読み取ろうとする東洋の伝統的な方法です。このアプリは、現代のAI技術と観相のアイデアを組み合わせて楽しむためのものです！科学的根拠より、ユニークな解釈に注目してくださいね！",
    person1Title: "一人目の主役", person2Title: "二人目の主役", uploadInstruction: "目鼻立ちがはっきりわかる<br/>正面写真をアップしてください！",
    uploadButton: "写真をアップ！", fileLoaded: "（読込完了！）", analyzeButton: "運命の相性分析スタート！", loadingMessage: "AIが全力で分析中！🔥もうすぐです！", watchAdButton: "広告を見て結果を確認！（ドキドキ）",
    errorMessageDefault: "お二人の写真を両方アップロードしてください。目鼻立ちがはっきりしている写真ほど、分析が正確になります！",
    noFaceDetectedError: "あれ、写真から顔を見つけるのが難しいです！😅 目鼻立ちがはっきりした正面写真で再試行すると、より正確な観相を見ることができます。",
    apiErrorGeneric: "APIリクエストに失敗しました", apiErrorResponseFormat: "AIが応答を準備できませんでした。😥 応答形式が正しくありません。しばらくしてからもう一度お試しください！", apiErrorJsonParse: "おっと！AIが興奮しすぎて応答形式を少し間違えてしまったようです。😂 少し待ってから再試行していただければ、今度こそちゃんとした結果をお見せします！", apiErrorNetwork: "分析中に予期せぬエラーが発生しました。😭 ネットワーク接続を確認して、もう一度お試しください！",
    resultTitle: "💖 AI面白観相占い結果 💖", personAnalysisTitleSuffix: "さんの観相総評！🧐", compatibilityTitle: "お二人の総合的な相性は？！💕", scoreUnit: "点！！！",
    scoreDefaultReason: "AI曰く：この点数は…運命です！✨", goodPointsTitle: "こういうところが相性バッチリ！👍", improvementPointsTitle: "これさえ気をつければ百点満点！⚠️",
    overallCommentTitle: "✨ AIの総合コメント ✨", defaultOverallComment: "AI曰く：お二人、もう結婚しちゃってください！（冗談抜きで😉）", adviceTitle: "💡 AIの爆笑デート術伝授！💡",
    shareTwitterButton: "Twitterで共有！", shareFacebookButton: "Facebookで共有！", retryButton: "最初からやり直す",
    shareLinkedInButton: "LinkedInで共有", shareInstagramButton: "Instagramで共有！",
    footerText: "© {year} AIカップル観相占い（面白総評版）。作った人も楽しんでます！😉",
    interstitialAdTitle: "ちょっと待って！🚀", interstitialAdBody1: "AIが二人の運命的な出会いを光の速さで分析中です！", interstitialAdBody2: "（この素敵な画面に広告がポン！と表示されるかも😉）", interstitialAdLoadingText: "運命のデスティニーを分析中…",
    rewardedAdTitle: "✨ 特別な結果の公開間近！✨", rewardedAdBody: "広告が終わると、二人の驚きの相性結果が公開されます！（ドキドキ）", rewardedAdFooter: "広告はスキップせずにお待ちください！すぐに結果がファンファーレと共に登場します！パーン！🎉",
    placeholderImageText1: "一人目の写真", placeholderImageText2: "二人目の写真", placeholderImageError: "あれ！写真が…！",
    adPlaceholderBannerText: "面白い広告バナー", adPlaceholderInterstitialText: "ドキドキの全面広告", adPlaceholderRewardedText: "面白いリワード広告",
    copyButton: "共有リンクをコピー", copySuccessMessage: "共有リンクがコピーされました！友達に自慢しちゃおう！💌", copyErrorMessage: "おっと！クリップボードへのコピーに失敗しました。😅",
    shareMessage: "私たちのカップル観相占いの結果が気になる？クリックしてチェックしてみて！👇",
    resultLoading: "結果を読み込み中...", resultNotFound: "あれ！該当する結果が見つかりません。アドレスが正しいか確認してください。",
    // 일본어 (ja)
    loadingComments: ["おお、その眉…ただ者じゃないですね？ 🤔", "お二人の鼻筋は芸術的ですね。少し鑑賞させて…👃", "AIの瞳でスキャン中…はっきりした眼差しを発見！ ✨", "口角が似ていますね！これは運命かも？ 🤭", "ちょっと待って、おでこから光が…輝きを分析中！ 💡"],
    aiPrompt: {
      instruction: "まず、提供された2つの画像にそれぞれ鮮明な人間の顔が含まれているか確認してください。どちらか一方でも顔でない、または顔の認識が困難な場合は、他のフィールドはすべて空のまま、JSONオブジェクトに 'error': 'NO_FACE_DETECTED' フィールドのみを含めて応答してください。両方の写真に顔が鮮明に写っている場合は、'error' フィールドなしで以下の指示に従って分析を進めてください。\n\n二人の写真が与えられます。各人物の全体的な印象と性格を、非常にウィットに富んだ成熟したユーモアを交えて、まるで「人生経験豊富な隣人」が核心を突くように分析してください。その際、各人物の**最も特徴的な目鼻立ちを1〜2つだけ**選び、その観相学的な意味を「なるほど！」と膝を打つような比喩やユーモアで解説し、それが全体的な性格や人生観とどう結びつくかを教えてください。「さて、どれどれ？この方は一目見ただけで〜」という感じで。この内容を 'overall_impression' フィールドに記述してください。分量は各人3〜4文程度で、軽すぎず重すぎず！その後、二人の相性を分析してください。相性スコア（0〜100点）とその理由を説明する際は、「緊張の瞬間！今日のカップル相性スコアはなんと〜！」のように期待感を煽りつつ、結果については「核心を突く」一言を添えてください。良い点（'good_points'）と努力すれば良くなる点（'areas_for_improvement'）はそれぞれ2つずつ、まるで「恋愛の達人」が現実的な指摘と温かい応援を同時に送るように記述してください。例えば、「これさえマスターすれば、ハリウッドカップルも顔負けの化学反応が爆発するかも！」のように。相性の総評（'overall_summary'）は、意外な展開のある短編映画のあらすじのように、あるいは次が気になる人気ドラマの名台詞のようにインパクトのある要約をしてください。最後に 'advice' フィールドには、二人でやれば「こんなクレイジーなことまでできるの？」と思うほど奇想天外で面白いデートのアイデアや、「これって完全に私たちのことじゃん？」と思うような関係のヒントを2つ提案してください。すべてのテキストには、核心を突く絵文字（😏、🔥、🤣、💡など）を適切に使い、より生き生きとさせてください！",
      jsonFormatInstruction: "回答は次のJSON形式で提供してください：", person1NameExample: "一人目のニックネーム（例：予測不能な自由人）", person1ImpressionExample: "おお〜、一人目の方、ただ者じゃないですね！😏 自由奔放さが漂う眼差しと少し上がった口角は、「私の辞書に不可能という文字はない！」と叫んでいるようです。特に、何にも縛られないような額のラインは、「人生は一度きり！」というYOLO精神を体現しています。おかげで周りに常に新鮮なインスピレーションを与えますが、時々あまりに即興的すぎて「どこに飛んでいくかわからないスーパーボール」のようだと言われることもあるでしょう！🤣", person2NameExample: "二人目のニックネーム（例：ギャップ萌えの鉄壁ディフェンダー）", person2ImpressionExample: "二人目の方は、表向きは「接近禁止」のオーラを放つ鉄壁ディフェンダーのようですが、実は情に厚いギャップ萌えの持ち主ですね！🧐 整った鼻筋と引き締まった口元は、「一度決めたことは最後までやり遂げる！」という意志を示していますが、意外な瞬間に見せる温かい眼差しがこの方の真の魅力！🔥 慎重さも良いですが、時にはその鉄壁を少し下げて、思い切って飛び込んでみる勇気も必要ですよ！", compatibilityScoreReasonExample: "🎉 ドキドキ…このカップル、相性スコアはなんと88点！これはもう「最悪のカップル」から「最高のカップル」に進化する直前ですね？！💕 異なる魅力が出会って予想外の相乗効果を生み出す、まさに「甘くてしょっぱい」組み合わせです！（でも、時々しょっぱすぎたり甘すぎたりしてお腹を壊す可能性あり！😉）", goodPoint1Example: "一人目の「まずやってみよう！」精神と、二人目の「石橋を叩いて壊す勢いで確かめよう！」精神が出会えば？世にもなかった創造的な結果がドーン！もしかしたら世界を変えるかも？💡", goodPoint2Example: "お互いの「オタク」領域を尊重するだけでなく、一緒にハマってみると、「え？私ってこんなのが好きだったの？」という新世界を体験し、関係の深さが格別になります！（ただし、通帳の残高は保証しません🤣）", improvementPoint1Example: "時々、一人目が先走りすぎて二人目が「ちょっと待って！」と叫ぶ前に遥か彼方へ行ってしまったり、二人目が慎重すぎて一人目が「あー、もう我慢できない！私がやる！」と言い出したりすることがあるかもしれません。お互いの「速度調整」能力をマックスレベルにすることが急務です！🚀", improvementPoint2Example: "表現方法が違いすぎて、「火星から来た男、金星から来た女」シーズン2を撮ることになるかも！「あうんの呼吸」もいいですが、時には「言葉にしないと分かりませんよ？」スキルも身につけないと、誤解なく末永く幸せにはなれません！💬", overallSummaryExample: "このカップル、一言で言うと「予測不能なジェットコースター」です！🎢 静かな日はなく、いつもいがみ合いながらもお互いなしでは生きていけない、そんな愛憎（？）の関係とでも言いましょうか。しかし確かなことは、二人の人生はお互いの存在によって、より色彩豊かで愉快になるということ！退屈はアンドロメダの彼方に吹き飛ばして、このスリリングな旅を存分に楽しんでください！🔥", advice1Example: "二人だけの「何でもありトークデート」はどうですか？一日中、お互いに思いついたことをフィルターなしで言い合ってみるんです！（ただし、終わった後に根に持たないこと！🤙）意外な本音や爆笑のユーモアが発見できるかもしれません！", advice2Example: "お互いの「黒歴史バトル」を開催してみてください！一番恥ずかしい過去の写真やエピソードを共有し、どちらがより強力な黒歴史を持っているか競うのです！笑いすぎて涙が出ても責任は負いません！😂 この過程で、お互いの人間的な魅力にさらに深く惹かれることでしょう！", languageInstructionSuffix: "すべての説明は、選択された言語（日本語）で、非常に親しみやすく、面白く、ユーモアとポジティブなエネルギーを込めて記述してください。"
    }
  },
  zh: {
    languageName: "中文",
    languageSelectLabel: "语言", languageKorean: "한국어", languageEnglish: "English", languageJapanese: "日本語", languageChinese: "中文", languageSpanish: "Español",
    appTitle: "AI情侣面相配对", appSubtitle: "只需上传照片！AI将为你们的命运相遇带来有趣的解读！😉", appDisclaimer: "（只是为了好玩，你懂的~찡긋~☆）",
    physiognomyIntroTitle: "✨ 什么是“面相”？", physiognomyIntroText: "“面相”是通过观察人的面部特征来了解其性格或命运的东方传统方法。这个应用结合了现代AI技术和面相的概念，纯属娱乐！请更关注有趣的解释，而不是科学依据哦！",
    person1Title: "第一位主角", person2Title: "第二位主角", uploadInstruction: "请上传五官清晰的<br/>正面照片！",
    uploadButton: "上传照片！", fileLoaded: "（加载完成！）", analyzeButton: "开始命运配对分析！", loadingMessage: "AI正在努力工作中！🔥 就快好了！", watchAdButton: "观看广告查看结果！（激动）",
    errorMessageDefault: "请上传两个人的照片。五官越清晰，分析越准确！",
    noFaceDetectedError: "哎呀，照片里很难找到人脸！😅 为了更准确的分析，请换一张五官清晰的正面照片再试一次。",
    apiErrorGeneric: "API请求失败", apiErrorResponseFormat: "AI未能准备好回应。😥 响应格式不正确。请稍后再试！", apiErrorJsonParse: "哎呀！AI太兴奋了，不小心搞错了回应格式。😂 请稍等片刻再试一次，这次一定给您看正确的结果！", apiErrorNetwork: "分析过程中发生意外错误。😭 请检查您的网络连接并重试！",
    resultTitle: "💖 AI趣味面相配对结果 💖", personAnalysisTitleSuffix: "的面相总评！🧐", compatibilityTitle: "你们的综合配对指数是？！💕", scoreUnit: "分！！！",
    scoreDefaultReason: "AI说：这个分数…是命运！✨", goodPointsTitle: "这些方面简直是天作之合！👍", improvementPointsTitle: "只要注意这些，就能白头偕老！⚠️",
    overallCommentTitle: "✨ AI的综合评价 ✨", defaultOverallComment: "AI说：你们俩，直接结婚吧！（不开玩笑😉）", adviceTitle: "💡 AI的超有趣约会秘诀传授！💡",
    shareTwitterButton: "分享到Twitter！", shareFacebookButton: "分享到Facebook！", retryButton: "重新开始",
    shareLinkedInButton: "分享到LinkedIn", shareInstagramButton: "分享到Instagram！",
    footerText: "© {year} AI情侣面相配对（趣味版）。创作者也玩得很开心！😉",
    interstitialAdTitle: "请稍候！🚀", interstitialAdBody1: "AI正在以光速分析你们的命运相遇！", interstitialAdBody2: "（这个漂亮的屏幕上可能会弹出广告哦😉）", interstitialAdLoadingText: "正在分析命运…",
    rewardedAdTitle: "✨ 即将揭晓特别结果！✨", rewardedAdBody: "广告结束后，你们惊人的配对结果即将揭晓！（激动）", rewardedAdFooter: "请不要跳过广告！结果即将伴随着礼炮声登场！砰！🎉",
    placeholderImageText1: "第一位的照片", placeholderImageText2: "第二位的照片", placeholderImageError: "哎呀！照片…！",
    adPlaceholderBannerText: "有趣的广告横幅", adPlaceholderInterstitialText: "激动人心的插页广告", adPlaceholderRewardedText: "有趣的奖励广告",
    copyButton: "复制分享链接", copySuccessMessage: "分享链接已复制！快去向朋友们炫耀吧！💌", copyErrorMessage: "哎呀！复制到剪贴板失败。😅",
    shareMessage: "好奇我们的情侣面相配对结果吗？点击查看！👇",
    resultLoading: "正在加载结果…", resultNotFound: "哎呀！找不到相应的结果。请检查网址是否正确。",
    // 중국어 (zh)
    loadingComments: ["哦，这对眉毛…不简单啊？ 🤔", "两位的鼻梁真是艺术品。让我欣赏一下...👃", "AI眼球扫描中…发现清晰的眼神！ ✨", "嘴角很像呢！这也许是命运？ 🤭", "请稍等，额头在发光…正在分析光彩！ 💡"],
    aiPrompt: {
      instruction: "首先，请确认提供的两张图片中是否都包含清晰的人脸。如果任何一张图片中没有人脸或难以识别人脸，请返回一个仅包含 'error': 'NO_FACE_DETECTED' 字段的JSON对象，其他字段留空。如果两张照片都清晰显示人脸，请按照以下说明进行分析，不要包含 'error' 字段。\n\n我们将提供两张照片。请用机智、成熟的幽默感，像一位“人生经验丰富的老友”一样，一针见血地分析每个人的整体印象和性格。请为每个人挑选**1-2个最独特的五官特征**，用巧妙的比喻或幽默来解释其面相学意义，并将其与整体性格和人生观联系起来。语气可以像这样：“好了，让我们看看……这个人一看就是……”。请将此内容填入 'overall_impression' 字段。每人的篇幅约为3-4句话，风格轻松又不失深度。然后，分析他们的相容性。在解释相容性分数（0-100分）及其原因时，要营造悬念，比如：“激动人心的时刻到了！你们的相容性分数是……！”并对结果给出一句精辟的点评。请列出两个“优点”（'good_points'）和两个“待改进之处”（'areas_for_improvement'），就像一位“约会专家”同时给出切中要害的反馈和温暖的鼓励。例如，“如果你们能掌握这一点，你们的化学反应将爆表，让好莱坞情侣都羡慕！”“总评”（'overall_summary'）要像一部情节曲折的短片简介或一句热门剧集中的经典台词一样，给人留下深刻印象。最后，在“建议”（'advice'）字段中，提出两个新奇有趣的约会点子或关系小贴士，让人们觉得“这完全说的就是我们！”。请适当使用表情符号（😏、🔥、🤣、💡等），使所有文本更加生动！",
      jsonFormatInstruction: "请用以下JSON格式提供答案：", person1NameExample: "第一位的昵称（例如：难以预测的自由灵魂）", person1ImpressionExample: "哦吼~ 第一位，一看就不是等闲之辈！😏 那自由不羁的眼神和微微上扬的嘴角，仿佛在宣告“我的字典里没有不可能！”。特别是那看起来无拘无束的额头，真正体现了“人生只有一次”的YOLO精神。虽然他们总能给周围的人带来新鲜灵感，但偶尔的即兴发挥也可能让他们被评价为“难以预测的弹力球”！🤣", person2NameExample: "第二位的昵称（例如：反差萌的铁壁防守者）", person2ImpressionExample: "第二位表面上看起来像个散发着“生人勿近”气场的铁壁防守者，但实际上是个内心温暖、充满反差萌的人！🧐 挺直的鼻梁和坚毅的嘴唇显示出“一旦决定就坚持到底”的决心，但在不经意间流露的温暖眼神才是他们真正的魅力所在！🔥 谨慎是好事，但有时也需要鼓起勇气，稍微放下防备，大胆尝试一下！", compatibilityScoreReasonExample: "🎉 噔噔噔噔~ 这对情侣的相容性分数高达88分！这简直是从“欢喜冤家”进化到“神仙眷侣”的前奏啊？！💕 不同的魅力相遇，擦出意想不到的协同效应，简直是“甜咸交织”的完美组合！（但请注意，有时可能会太咸或太甜，小心伤胃哦！😉）", goodPoint1Example: "当第一位的“先做再说”精神遇上第二位的“把石桥敲碎了再过”的心态时会发生什么？一个前所未有的创造性成果诞生了！说不定还能改变世界呢？💡", goodPoint2Example: "当你们不仅尊重彼此的“爱好圈”，甚至一起沉浸其中时，你们会发现一个全新的世界，心想：“咦？我原来喜欢这个？” 这将以独特的方式加深你们的关系！（免责声明：我们对您的银行账户余额概不负责🤣）", improvementPoint1Example: "有时第一位可能冲得太快，让第二位还在喊“嘿，等一下！”时就已远去；或者第二位可能过于谨慎，让第一位大喊“唉，我受不了了！我自己来！”。你们迫切需要提升彼此的“步调协调”能力！🚀", improvementPoint2Example: "你们的表达方式差异太大，可能会感觉像在拍《男人来自火星，女人来自金星》第二季。虽然心有灵犀很好，但有时也需要掌握“有话直说”的技能，才能避免误会，长久幸福地在一起！💬", overallSummaryExample: "总而言之，这对情侣就是一部“难以预测的过山车”！🎢 没有平静的日子，总是在吵吵闹鬧中却又离不开彼此。但可以肯定的是，你们的生活因为对方而变得更加丰富多彩和愉快！把无聊送到仙女座去，尽情享受这段惊险刺激的旅程吧！🔥", advice1Example: "来一场“胡言乱语约会”怎么样？在一天之内，毫无过滤地对彼此说出脑海中浮现的任何话！（但事后不能记仇哦！🤙）你们可能会发现意想不到的真心话或爆笑的幽"
    }
  },
  es: {
    languageName: "Español",
    languageSelectLabel: "Idioma", languageKorean: "한국어", languageEnglish: "English", languageJapanese: "日本語", languageChinese: "中文", languageSpanish: "Español",
    appTitle: "Fisonomía de Parejas con IA", appSubtitle: "¡Solo sube tus fotos! ¡La IA analizará de forma divertida su fatídico encuentro! 😉", appDisclaimer: "(Es solo por diversión, ¿sabes? Guiño~☆)",
    physiognomyIntroTitle: "✨ ¿Qué es la 'Fisonomía'?", physiognomyIntroText: "La 'Fisonomía' es un método tradicional oriental para entender la personalidad o el destino de una persona a través de sus rasgos faciales. ¡Esta aplicación combina la idea de la fisonomía con la IA moderna para divertirse! ¡Por favor, céntrate en las interpretaciones alegres en lugar de en la evidencia científica!",
    person1Title: "Primera Persona", person2Title: "Segunda Persona", uploadInstruction: "¡Sube una foto frontal clara<br/>donde los rasgos faciales sean visibles!",
    uploadButton: "¡Subir Foto!", fileLoaded: "¡Cargada!", analyzeButton: "¡Comenzar Análisis de Destino!", loadingMessage: "¡La IA está trabajando duro! 🔥 ¡Casi listo!", watchAdButton: "¡Ver Anuncio para ver Resultados! (Emocionante)",
    errorMessageDefault: "Por favor, sube las fotos de ambas personas. ¡Cuanto más claros sean los rasgos faciales, más preciso será el análisis!",
    noFaceDetectedError: "¡Uy, es difícil encontrar una cara en la foto! 😅 Para una lectura más precisa, inténtalo de nuevo con una foto frontal clara donde los rasgos faciales sean visibles.",
    apiErrorGeneric: "Falló la solicitud a la API", apiErrorResponseFormat: "La IA no pudo preparar una respuesta. 😥 El formato de la respuesta es incorrecto. ¡Por favor, inténtalo de nuevo más tarde!", apiErrorJsonParse: "¡Uy! La IA se emocionó demasiado y cometió un pequeño error con el formato de la respuesta. 😂 Si esperas un momento y lo intentas de nuevo, ¡esta vez te daremos los resultados correctos!", apiErrorNetwork: "Ocurrió un error inesperado durante el análisis. 😭 Por favor, comprueba tu conexión de red e inténtalo de nuevo.",
    resultTitle: "💖 Resultados Divertidos de Compatibilidad de Fisonomía con IA 💖", personAnalysisTitleSuffix: " - ¡Resumen de Fisonomía! 🧐", compatibilityTitle: "¿Y qué hay de su compatibilidad general? 💕", scoreUnit: " Puntos!!!",
    scoreDefaultReason: "La IA dice: ¡Esta puntuación... es el destino! ✨", goodPointsTitle: "¡Son una pareja perfecta en estos aspectos! 👍", improvementPointsTitle: "¡Cuidado con esto para vivir felices para siempre! ⚠️",
    overallCommentTitle: "✨ Comentario General de la IA ✨", defaultOverallComment: "La IA dice: ¡Ustedes dos, cásense ya! (No es broma 😉)", adviceTitle: "💡 ¡Consejos Súper Divertidos de la IA para Citas! 💡",
    shareTwitterButton: "¡Compartir en Twitter!", shareFacebookButton: "¡Compartir en Facebook!", retryButton: "Empezar de Nuevo",
    shareLinkedInButton: "Compartir en LinkedIn", shareInstagramButton: "¡Compartir en Instagram!",
    footerText: "© {year} Fisonomía de Parejas con IA (Edición Divertida). ¡El creador también se divirtió! 😉",
    interstitialAdTitle: "¡Un momento! 🚀", interstitialAdBody1: "¡La IA está analizando su fatídico encuentro a la velocidad de la luz!", interstitialAdBody2: "(Podría aparecer un anuncio en esta genial pantalla 😉)", interstitialAdLoadingText: "Analizando el destino...",
    rewardedAdTitle: "✨ ¡Revelando resultados especiales pronto! ✨", rewardedAdBody: "¡Después del anuncio, se revelarán sus increíbles resultados de compatibilidad! (Emocionante)", rewardedAdFooter: "¡No te saltes el anuncio! ¡Los resultados aparecerán con una fanfarria! ¡Tachán! 🎉",
    placeholderImageText1: "Foto+Persona+1", placeholderImageText2: "Foto+Persona+2", placeholderImageError: "¡Uy!+La+foto...¡Puf!",
    adPlaceholderBannerText: "Banner+de+Anuncio+Divertido", adPlaceholderInterstitialText: "Anuncio+Intersticial+Emocionante", adPlaceholderRewardedText: "Anuncio+Recompensado+Divertido",
    copyButton: "Copiar Enlace", copySuccessMessage: "¡Enlace para compartir copiado! ¡Presúmelo con tus amigos! 💌", copyErrorMessage: "¡Uy! No se pudo copiar al portapapeles. 😅",
    shareMessage: "¿Sientes curiosidad por nuestros resultados de fisonomía de pareja? ¡Haz clic para ver! 👇",
    resultLoading: "Cargando resultados...", resultNotFound: "¡Uy! No se pudo encontrar el resultado. Por favor, comprueba la URL.",
    // 스페인어 (es)
    loadingComments: ["Vaya, esas cejas... ¡son extraordinarias! 🤔", "Los puentes de sus narices son artísticos. Déjenme admirarlos un momento...👃", "Escaneando con mis ojos de IA... ¡he encontrado una mirada nítida! ✨", "¡Las comisuras de sus labios son parecidas! ¿Será el destino? 🤭", "Un momento, hay un brillo en la frente... ¡analizando el resplandor! 💡"],
    aiPrompt: {
      instruction: "Primero, verifica que cada una de las dos imágenes proporcionadas contenga una cara humana clara. Si alguna de las imágenes no contiene una cara reconocible, devuelve un objeto JSON solo con un campo 'error': 'NO_FACE_DETECTED', dejando todos los demás campos vacíos. Si ambas fotos muestran caras claramente, procede con el análisis como se indica a continuación, sin el campo 'error'.\n\nSe te darán dos fotos. Analiza la impresión general y la personalidad de cada persona con un humor ingenioso y maduro, como si un 'amigo sabio y mayor' estuviera dando un análisis certero. Elige **solo 1-2 de los rasgos faciales más distintivos** para cada persona y explica su significado fisonómico con analogías o humor inteligente, conectándolo con su personalidad y visión de la vida en general. Usa un tono como, \"Bien, veamos... Esta persona es claramente...\" para el campo 'overall_impression'. La longitud debe ser de unas 3-4 frases por persona, logrando un equilibrio entre lo desenfadado y lo serio. Luego, analiza su compatibilidad. Al explicar la puntuación de compatibilidad (0-100) y su motivo, crea expectación como, \"¡Y ahora, el momento de la verdad! ¡Su puntuación de compatibilidad es...!\" y añade una frase contundente sobre el resultado. Enumera dos 'good_points' y dos 'areas_for_improvement' como si un 'gurú de las citas' estuviera dando tanto una retroalimentación realista como un cálido aliento. Por ejemplo, '¡Si dominan esto, su química será explosiva, dando envidia a las parejas de Hollywood!' El 'overall_summary' debe ser impactante, como la sinopsis de un cortometraje con un giro inesperado o una línea memorable de un drama popular que te deja con ganas de más. Finalmente, en el campo 'advice', sugiere dos ideas para citas peculiares y divertidas o consejos de relación tan cercanos que pensarán, '¡Esto somos totalmente nosotros!'. Usa emojis (😏, 🔥, 🤣, 💡, etc.) apropiadamente para hacer que todo el texto sea más vivo.",
      jsonFormatInstruction: "Proporciona la respuesta en el siguiente formato JSON:", person1NameExample: "Apodo de la Persona 1 (ej: Espíritu Libre Impredecible)", person1ImpressionExample: "¡Vaya, la Persona 1 no es para nada ordinaria! 😏 Esa mirada de espíritu libre y los labios ligeramente curvados hacia arriba parecen gritar: '¡Nada es imposible para mí!' Especialmente esa frente, que parece no estar atada a nada, realmente encarna el espíritu 'YOLO'. Aportan inspiración fresca a quienes les rodean, ¡pero su ocasional espontaneidad podría hacer que se ganen la reputación de ser una 'pelota impredecible'! 🤣", person2NameExample: "Apodo de la Persona 2 (ej: Defensor Estoico con un Giro)", person2ImpressionExample: "La Persona 2 puede parecer un defensor estoico con un aura de 'mantente alejado', ¡pero es una persona de profundo afecto con un encanto oculto! 🧐 La nariz recta y los labios firmes muestran una determinación para llevar las cosas hasta el final, ¡pero la calidez en su mirada, revelada en momentos inesperados, es su verdadero encanto! 🔥 Si bien la precaución es buena, ¡a veces necesitan el coraje para bajar esa guardia y simplemente lanzarse!", compatibilityScoreReasonExample: "🎉 ¡Redoble de tambores, por favor! ¡La puntuación de compatibilidad de esta pareja es un impresionante 88! ¡Están a punto de evolucionar de una 'pareja loca' a una 'pareja fantástica'! 💕 ¡Es una combinación 'dulce y salada' donde diferentes encantos se encuentran para crear una sinergia inesperada! (¡Pero cuidado, a veces puede ser demasiado salado o dulce! 😉)", goodPoint1Example: "¿Qué pasa cuando el espíritu de 'actúa primero, piensa después' de la Persona 1 se encuentra con la mentalidad de 'probaré el terreno hasta que se rompa' de la Persona 2? ¡Un resultado creativo e innovador! ¿Quién sabe, incluso podría cambiar el mundo? 💡", goodPoint2Example: "Cuando no solo respetan, sino que también se sumergen en los 'fandoms' del otro, descubrirán un mundo completamente nuevo, pensando: '¿Eh? ¿Me gustaba esto?' ¡Esto profundizará su relación de maneras únicas! (Descargo de responsabilidad: no nos hacemos responsables del saldo de su cuenta bancaria 🤣)", improvementPoint1Example: "A veces, la Persona 1 puede adelantarse tanto que la Persona 2 se queda atrás gritando: '¡Oye, espera un minuto!' O la Persona 2 puede ser tan cautelosa que la Persona 1 exclama: '¡Uf, lo haré yo mismo!' ¡Necesitan urgentemente mejorar sus habilidades de 'ritmo'! 🚀", improvementPoint2Example: "Sus estilos de expresión son tan diferentes que podrían sentir que están en una secuela de 'Los hombres son de Marte, las mujeres son de Venus'. Si bien la comprensión tácita es genial, ¡necesitarán equiparse con la habilidad de 'necesitas decirlo en voz alta' para evitar malentendidos y ser felices por mucho, mucho tiempo! 💬", overallSummaryExample: "En una palabra, ¡esta pareja es una 'montaña rusa impredecible'! 🎢 Nunca un momento aburrido, siempre discutiendo pero no pueden vivir el uno sin el otro. ¡Pero una cosa es segura, sus vidas serán mucho más coloridas y alegres gracias al otro! ¡Envíen el aburrimiento a Andrómeda y disfruten al máximo de este emocionante viaje! 🔥", advice1Example: "¿Qué tal una 'Cita de Disparates'? ¡Por un día, digan lo que se les ocurra sin ningún filtro! (¡Sin resentimientos después! 🤙) ¡Podrían descubrir verdades inesperadas o chistes hilarantes!", advice2Example: "¡Organicen una 'Batalla de Pasados Vergonzosos'! ¡Compartan sus fotos o historias antiguas más vergonzosas y compitan para ver quién tiene el pasado más bochornoso! ¡No nos hacemos responsables si se ríen tanto que lloran! 😂 ¡Esto les ayudará a enamorarse más profundamente del lado humano del otro!", languageInstructionSuffix: "Todas las descripciones deben estar escritas en el idioma seleccionado (Español) en un tono muy amigable, divertido, humorístico y positivo."
    }
  }
};

const getBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = (error) => reject(error);
});

const uploadImageToStorage = async (file) => {
  if (!storage) throw new Error("Firebase Storage is not initialized.");
  const fileName = `face-images/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, fileName);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

// 숫자 카운트업 애니메이션을 위한 커스텀 훅
const useCountUp = (end, duration = 1500) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (typeof end !== 'number') { setCount(0); return; }
        let frame = 0;
        const totalFrames = Math.round(duration / (1000 / 60));
        const counter = setInterval(() => {
            frame++;
            const progress = 1 - Math.pow(1 - (frame / totalFrames), 3);
            const currentCount = Math.round(end * progress);
            if (frame >= totalFrames) { setCount(end); clearInterval(counter); }
            else { setCount(currentCount); }
        }, 1000 / 60);
        return () => clearInterval(counter);
    }, [end, duration]);
    return count;
};

// 드래그 앤 드롭 기능을 포함한 이미지 업로드 컴포넌트
const ImageDropzone = ({ personNum, onImageSelect, previewImage, title, instruction, strings }) => {
  const [isDragging, setIsDragging] = useState(false);
  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) onImageSelect(files[0], personNum);
  };
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) onImageSelect(files[0], personNum);
  };
  const borderColor = personNum === 1 ? 'border-rose-300 hover:border-rose-500' : 'border-fuchsia-300 hover:border-fuchsia-500';
  const draggingBorderColor = personNum === 1 ? 'border-rose-600' : 'border-fuchsia-600';
  const bgColor = personNum === 1 ? 'bg-rose-50/50' : 'bg-fuchsia-50/50';
  const draggingBgColor = personNum === 1 ? 'bg-rose-100' : 'bg-fuchsia-100';
  const buttonColor = personNum === 1 ? 'bg-rose-500 hover:bg-rose-600' : 'bg-fuchsia-500 hover:bg-fuchsia-600';

  return (
    <div onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 flex flex-col items-center justify-between ${borderColor} ${bgColor} ${isDragging ? `${draggingBorderColor} ${draggingBgColor} scale-105` : ''}`}>
      <div>
        <h2 className="text-2xl font-bold mb-3 font-gaegu">{title} 👑</h2>
        <div className="bg-white/80 border border-gray-200 rounded-md p-2 mb-4 shadow-sm">
            <p className="text-sm font-bold text-indigo-600" dangerouslySetInnerHTML={{ __html: instruction }}></p>
        </div>
      </div>
      <img src={previewImage} alt={`${title}`} className="w-48 h-48 md:w-56 md:h-56 object-cover mx-auto rounded-full shadow-xl mb-4 border-4 border-white" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/f87171/fecaca?text=${strings.placeholderImageError.replace(/\+/g, '%20')}`; }}/>
      <label htmlFor={`person${personNum}ImageUpload`} className={`cursor-pointer inline-flex items-center justify-center px-6 py-3 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 mt-auto text-lg font-gaegu ${buttonColor}`}>
        <UploadCloudIcon className="w-6 h-6 mr-2" />
        {strings.uploadButton}
      </label>
      <input type="file" id={`person${personNum}ImageUpload`} accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
};

// 재미 요소를 더한 새로운 로딩 화면 컴포넌트
const AnalysisLoadingComponent = ({ image1, image2, strings }) => {
    const [comment, setComment] = useState(strings.loadingComments[0]);
    useEffect(() => {
        const commentInterval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * strings.loadingComments.length);
            setComment(strings.loadingComments[randomIndex]);
        }, 2500);
        return () => clearInterval(commentInterval);
    }, [strings.loadingComments]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 p-4 text-white font-gaegu">
            <div className="relative w-full max-w-md flex items-center justify-center mb-8">
                <img src={image1} alt="Person 1" className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full shadow-lg border-4 border-rose-400 animate-pulse" />
                <svg className="absolute w-1/2 h-full text-cyan-300" viewBox="0 0 100 50" preserveAspectRatio="none">
                    <path d="M0 25 Q 25 10, 50 25 T 100 25" stroke="currentColor" strokeWidth="2" fill="none" className="animate-pulse" style={{ strokeDasharray: 5, animation: 'dash 1s linear infinite' }} />
                    <path d="M0 25 Q 25 40, 50 25 T 100 25" stroke="currentColor" strokeWidth="1" fill="none" className="opacity-70 animate-pulse" style={{ strokeDasharray: 5, animation: 'dash 1.5s linear infinite reverse' }} />
                </svg>
                <img src={image2} alt="Person 2" className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full shadow-lg border-4 border-fuchsia-400 animate-pulse" />
            </div>
            <div className="text-center">
                <p className="text-xl md:text-2xl h-16 flex items-center justify-center transition-opacity duration-500">"{comment}"</p>
                <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full mx-auto animate-spin mt-4"></div>
                <p className="text-purple-300 mt-3 font-semibold text-lg">{strings.loadingMessage}</p>
            </div>
            <style>{`@keyframes dash { to { stroke-dashoffset: 100; } }`}</style>
        </div>
    );
};


const App = () => {
  const getInitialLanguage = useCallback(() => {
    if (typeof window === 'undefined' || !window.navigator) return 'en';
    const browserLang = window.navigator.language || window.navigator.userLanguage;
    const langCode = browserLang.split('-')[0];
    return translations[langCode] ? langCode : 'en';
  }, []);
  const [language, setLanguage] = useState(getInitialLanguage);
  const [currentStrings, setCurrentStrings] = useState(translations[language]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const [person1ImageFile, setPerson1ImageFile] = useState(null);
  const [person1ImagePreview, setPerson1ImagePreview] = useState(null);
  const [person2ImageFile, setPerson2ImageFile] = useState(null);
  const [person2ImagePreview, setPerson2ImagePreview] = useState(null);

  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [pageState, setPageState] = useState('main');
  const [resultId, setResultId] = useState(null);

  const [showResults, setShowResults] = useState(false);
  const [isWatchingRewardedAd, setIsWatchingRewardedAd] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  const resetPlaceholders = useCallback((strings) => {
    if (strings && strings.placeholderImageText1 && !person1ImageFile) {
      setPerson1ImagePreview(`https://placehold.co/400x400/e2e8f0/cbd5e0?text=${strings.placeholderImageText1.replace(/\+/g, '%20')}`);
    }
    if (strings && strings.placeholderImageText2 && !person2ImageFile) {
      setPerson2ImagePreview(`https://placehold.co/400x400/e9d5ff/a855f7?text=${strings.placeholderImageText2.replace(/\+/g, '%20')}`);
    }
  }, [person1ImageFile, person2ImageFile]);

  useEffect(() => {
    const path = window.location.pathname.split('/');
    if (path[1] === 'result' && path[2]) {
      const id = path[2];
      setPageState('loadingResult');

      const fetchResult = async () => {
        try {
          if (!db) throw new Error("Firestore is not initialized.");
          const docRef = doc(db, "results", id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const resultData = docSnap.data();
            if (resultData.language && translations[resultData.language]) {
              setLanguage(resultData.language);
              setCurrentStrings(translations[resultData.language]);
            }
            setAnalysisResult(resultData.analysis);
            setPerson1ImagePreview(resultData.person1ImageURL);
            setPerson2ImagePreview(resultData.person2ImageURL);
            setResultId(id);
            setPageState('resultView');
            setShowResults(true);
          } else {
            setError(currentStrings.resultNotFound);
            setPageState('main');
          }
        } catch (e) {
          console.error("Error fetching result:", e);
          setError(currentStrings.resultNotFound);
          setPageState('main');
        }
      };
      fetchResult();
    }
  }, [currentStrings.resultNotFound]);

  useEffect(() => {
    setCurrentStrings(translations[language]);
    if (pageState === 'main') {
      resetPlaceholders(translations[language]);
    }
  }, [language, pageState, resetPlaceholders]);

  const selectLanguage = (langCode) => {
    setLanguage(langCode);
    setShowLanguageDropdown(false);
  };

  const resetAllStates = () => {
    window.history.pushState({}, '', '/');
    setPerson1ImageFile(null);
    setPerson2ImageFile(null);
    setAnalysisResult(null);
    setError('');
    setShowResults(false);
    setIsWatchingRewardedAd(false);
    setCopyStatus('');
    setIsLoading(false);
    setPageState('main');
    setResultId(null);
  };

  const handleImageChange = (file, person) => {
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (person === 1) {
        setPerson1ImageFile(file);
        setPerson1ImagePreview(previewUrl);
      } else {
        setPerson2ImageFile(file);
        setPerson2ImagePreview(previewUrl);
      }
      setAnalysisResult(null);
      setError('');
      setShowResults(false);
      setIsWatchingRewardedAd(false);
      setCopyStatus('');
    }
  };

  const saveResultToFirestore = async (analysis, person1ImageURL, person2ImageURL, lang) => {
    if (!db) throw new Error("Failed to save result. DB not initialized.");
    try {
      const docRef = doc(collection(db, "results"));
      await setDoc(docRef, { analysis, person1ImageURL, person2ImageURL, language: lang, createdAt: serverTimestamp() });
      return docRef.id;
    } catch (e) {
      console.error("Error adding document: ", e);
      throw new Error("Failed to save result to server.");
    }
  };

  const cleanupFirestoreDocuments = useCallback(async (imageName) => {
    // ... (기존과 동일) ...
  }, []);

  const cleanupStorageIfNeeded = useCallback(async () => {
    // ... (기존과 동일) ...
  }, [cleanupFirestoreDocuments]);

  const handleAnalysis = useCallback(async () => {
    if (!person1ImageFile || !person2ImageFile) {
      setError(currentStrings.errorMessageDefault);
      return;
    }

    setIsLoading(true);
    setError('');
    setAnalysisResult(null);
    setShowResults(false);

    try {
      await cleanupStorageIfNeeded();
      const base64Image1 = await getBase64(person1ImageFile);
      const mimeType1 = person1ImageFile.type;
      const base64Image2 = await getBase64(person2ImageFile);
      const mimeType2 = person2ImageFile.type;

      const currentPromptStrings = translations[language].aiPrompt;
      const langName = translations[language].languageName;

      const jsonExample = {
        person1_analysis: { name: currentPromptStrings.person1NameExample, overall_impression: currentPromptStrings.person1ImpressionExample },
        person2_analysis: { name: currentPromptStrings.person2NameExample, overall_impression: currentPromptStrings.person2ImpressionExample },
        compatibility: {
          score: 88,
          score_reason: currentPromptStrings.compatibilityScoreReasonExample,
          good_points: [currentPromptStrings.goodPoint1Example, currentPromptStrings.goodPoint2Example],
          areas_for_improvement: [currentPromptStrings.improvementPoint1Example, currentPromptStrings.improvementPoint2Example],
          overall_summary: currentPromptStrings.overallSummaryExample,
          advice: [currentPromptStrings.advice1Example, currentPromptStrings.advice2Example]
        }
      };
      const languageInstruction = currentPromptStrings.languageInstructionSuffix ? currentPromptStrings.languageInstructionSuffix.replace(/\(([^)]+)\)/, `(${langName})`) : "";
      const prompt = `${currentPromptStrings.instruction}\n\n${currentPromptStrings.jsonFormatInstruction}\n${JSON.stringify(jsonExample, null, 2)}\n\n${languageInstruction}`;

      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: mimeType1, data: base64Image1 } }, { inlineData: { mimeType: mimeType2, data: base64Image2 } }] }],
        generationConfig: { responseMimeType: "application/json" }
      };

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${currentStrings.apiErrorGeneric}: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
        const parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);
        if (parsedJson.error && parsedJson.error === 'NO_FACE_DETECTED') {
          throw new Error(currentStrings.noFaceDetectedError);
        }
        setAnalysisResult(parsedJson);

        const isPreview = !GEMINI_API_KEY;
        if (!isPreview && db && storage) {
          const person1URL = await uploadImageToStorage(person1ImageFile);
          const person2URL = await uploadImageToStorage(person2ImageFile);
          const newResultId = await saveResultToFirestore(parsedJson, person1URL, person2URL, language);
          setResultId(newResultId);
          window.history.pushState({}, '', `/result/${newResultId}`);
        }
      } else {
        throw new Error(currentStrings.apiErrorResponseFormat);
      }
      setIsLoading(false);
    } catch (err) {
      console.error('분석 또는 저장 중 오류 발생:', err);
      setError(`${err.message}`);
      setIsLoading(false);
    }
  }, [person1ImageFile, person2ImageFile, language, currentStrings, cleanupStorageIfNeeded]);

  const handleWatchRewardedAd = () => {
    setIsWatchingRewardedAd(true);
    setTimeout(() => {
      setShowResults(true);
      setIsWatchingRewardedAd(false);
      setPageState('resultView');
    }, 3000);
  };

  const handleCopyToClipboard = () => {
    const shareUrl = `${window.location.origin}/result/${resultId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopyStatus(currentStrings.copySuccessMessage);
    }).catch(err => {
      setCopyStatus(currentStrings.copyErrorMessage);
      console.error('클립보드 복사 실패:', err);
    });
    setTimeout(() => setCopyStatus(''), 3000);
  };

  const generateShareText = () => currentStrings.shareMessage;
  const renderHearts = (score) => (<div className="flex">{[...Array(5)].map((_, i) => (<HeartIcon key={i} className={`w-8 h-8 ${i < Math.round((score / 100) * 5) ? 'text-red-500' : 'text-gray-300'}`} filled={i < Math.round((score / 100) * 5)} />))}</div>);
  const RegularAdPlaceholder = () => (<div className="my-6 p-3 bg-gray-100 rounded-lg text-center border border-gray-300"><p className="text-gray-600 text-xs">{currentStrings.adPlaceholderBannerText && currentStrings.adPlaceholderBannerText.split('+').join(' ') + " (찡긋 😉)"}</p><img src={`https://placehold.co/300x100/e0e0e0/757575?text=${currentStrings.adPlaceholderBannerText ? currentStrings.adPlaceholderBannerText.replace(/\+/g, '%20') : 'Ad'}`} alt="Regular Ad Banner Example" className="mx-auto mt-1 rounded" onError={(e) => { e.target.src = `https://placehold.co/300x100/e0e0e0/757575?text=Error`; }}/></div>);

  const MainPageComponent = () => (
    <div className="font-gowun">
      <section className="mb-8 p-4 bg-indigo-50 rounded-lg shadow"><h3 className="text-xl font-bold text-indigo-700 mb-2 text-center font-gaegu">{currentStrings.physiognomyIntroTitle}</h3><p className="text-sm text-gray-600 leading-relaxed text-center">{currentStrings.physiognomyIntroText}</p></section>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ImageDropzone personNum={1} onImageSelect={handleImageChange} previewImage={person1ImagePreview} title={currentStrings.person1Title} instruction={currentStrings.uploadInstruction} strings={currentStrings} />
        <ImageDropzone personNum={2} onImageSelect={handleImageChange} previewImage={person2ImagePreview} title={currentStrings.person2Title} instruction={currentStrings.uploadInstruction} strings={currentStrings} />
      </section>
      <RegularAdPlaceholder />
      <section className="mb-8 text-center">
        {!analysisResult && !isLoading && (
          <button onClick={handleAnalysis} disabled={!person1ImageFile || !person2ImageFile} className="px-12 py-5 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-2xl rounded-lg shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 font-gaegu">
            <HeartIcon className="inline-block w-8 h-8 mr-2 animate-ping" filled={true} />{currentStrings.analyzeButton}
          </button>
        )}
        {analysisResult && !isLoading && !showResults && (
          <button onClick={handleWatchRewardedAd} className="px-10 py-5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold text-xl rounded-lg shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center mx-auto font-gaegu">
            <PlayCircleIcon className="w-7 h-7 mr-2" />{currentStrings.watchAdButton}
          </button>
        )}
      </section>
    </div>
  );

  const ResultPageComponent = () => {
      const animatedScore = useCountUp(analysisResult.compatibility?.score);
      const [sectionsVisible, setSectionsVisible] = useState({ details: false, score: false, summary: false, advice: false });
      useEffect(() => {
          const timers = [
              setTimeout(() => setSectionsVisible(prev => ({ ...prev, details: true })), 200),
              setTimeout(() => setSectionsVisible(prev => ({ ...prev, score: true })), 400),
              setTimeout(() => setSectionsVisible(prev => ({ ...prev, summary: true })), 800),
              setTimeout(() => setSectionsVisible(prev => ({ ...prev, advice: true })), 1200),
          ];
          return () => timers.forEach(clearTimeout);
      }, []);
      const sectionTransition = "transition-all duration-700 ease-out";
      const sectionHidden = "opacity-0 transform -translate-y-5";
      const getSectionClass = (isVisible) => isVisible ? 'opacity-100 translate-y-0' : sectionHidden;

      return (
          <section className="bg-white/80 p-6 rounded-xl shadow-xl mt-8 font-gowun text-lg overflow-hidden">
              <h2 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 mb-8 animate-bounce font-gaegu">{currentStrings.resultTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"><div className="flex flex-col items-center"><img src={person1ImagePreview} alt={currentStrings.person1Title} className="w-48 h-48 md:w-56 md:h-56 object-cover mx-auto rounded-full shadow-xl border-4 border-white" /><h3 className="text-2xl font-bold mt-4 text-rose-600 font-gaegu">{analysisResult.person1_analysis?.name || currentStrings.person1Title}</h3></div><div className="flex flex-col items-center"><img src={person2ImagePreview} alt={currentStrings.person2Title} className="w-48 h-48 md:w-56 md:h-56 object-cover mx-auto rounded-full shadow-xl border-4 border-white" /><h3 className="text-2xl font-bold mt-4 text-fuchsia-600 font-gaegu">{analysisResult.person2_analysis?.name || currentStrings.person2Title}</h3></div></div>
              {analysisResult && (
                  <>
                      <div className={`${sectionTransition} ${getSectionClass(sectionsVisible.details)} grid grid-cols-1 md:grid-cols-2 gap-6 mb-10`}>
                          {[analysisResult.person1_analysis, analysisResult.person2_analysis].map((person, personIndex) => (<div key={personIndex} className={`p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300 ${personIndex === 0 ? 'bg-gradient-to-br from-rose-100 to-pink-200 border-rose-300' : 'bg-gradient-to-br from-fuchsia-100 to-purple-200 border-fuchsia-300'} border-2`}><h3 className={`text-3xl font-bold mb-4 text-center font-gaegu ${personIndex === 0 ? 'text-rose-600' : 'text-fuchsia-600'}`}>{(person?.name || (personIndex === 0 ? currentStrings.person1Title : currentStrings.person2Title))} {currentStrings.personAnalysisTitleSuffix}</h3><div className="relative"><p className="text-md leading-relaxed whitespace-pre-line p-4 bg-white/70 rounded-lg shadow-inner">{person?.overall_impression || "..."}</p></div></div>))}
                      </div>
                      <div className={`${sectionTransition} ${getSectionClass(sectionsVisible.score)} bg-gradient-to-br from-indigo-100 to-blue-200 p-6 rounded-xl shadow-xl border-2 border-indigo-300`}>
                          <h3 className="text-3xl font-bold text-indigo-700 mb-6 text-center font-gaegu">{currentStrings.compatibilityTitle}</h3><div className="flex justify-center mb-4">{renderHearts(analysisResult.compatibility?.score || 0)}</div><p className="text-5xl md:text-6xl font-bold text-indigo-600 mb-2 text-center font-gaegu">{animatedScore}{currentStrings.scoreUnit}</p><p className="text-md text-gray-700 mb-6 italic text-center p-2 bg-white/50 rounded-md">{analysisResult.compatibility?.score_reason || currentStrings.scoreDefaultReason}</p>
                          <div className="text-left space-y-6">{analysisResult.compatibility?.good_points?.length > 0 && (<div><h4 className="text-xl font-bold text-green-700 mb-2 flex items-center font-gaegu"><ThumbsUpIcon className="w-6 h-6 mr-2 text-green-500" /> {currentStrings.goodPointsTitle}</h4>{analysisResult.compatibility.good_points.map((point, index) => (<p key={index} className="text-md text-gray-800 mb-1 p-3 bg-green-100 rounded-lg shadow-sm">- {point}</p>))}</div>)}{analysisResult.compatibility?.areas_for_improvement?.length > 0 && (<div><h4 className="text-xl font-bold text-red-700 mb-2 flex items-center font-gaegu"><ThumbsDownIcon className="w-6 h-6 mr-2 text-red-500" /> {currentStrings.improvementPointsTitle}</h4>{analysisResult.compatibility.areas_for_improvement.map((area, index) => (<p key={index} className="text-md text-gray-800 mb-1 p-3 bg-red-100 rounded-lg shadow-sm">- {area}</p>))}</div>)}</div>
                      </div>
                      <div className={`${sectionTransition} ${getSectionClass(sectionsVisible.summary)} mt-8 p-6 bg-white rounded-xl shadow-lg`}><h4 className="text-2xl font-bold text-indigo-700 mt-8 mb-3 text-center font-gaegu">{currentStrings.overallCommentTitle}</h4><p className="text-md text-gray-800 leading-relaxed whitespace-pre-line p-4 bg-white/70 rounded-lg shadow-inner mb-8">{analysisResult.compatibility?.overall_summary || currentStrings.defaultOverallComment}</p></div>
                      <div className={`${sectionTransition} ${getSectionClass(sectionsVisible.advice)} mt-8 p-6 bg-white rounded-xl shadow-lg`}><h4 className="text-2xl font-bold text-indigo-700 mt-8 mb-3 text-center font-gaegu">{currentStrings.adviceTitle}</h4>{analysisResult.compatibility?.advice?.map((adv, index) => (<p key={index} className="text-md text-gray-800 mb-2 p-3 bg-indigo-100 rounded-lg shadow-sm">- {adv}</p>))}</div>
                      <div className="mt-10 pt-6 border-t border-gray-300"><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 font-gaegu text-sm"><button onClick={handleCopyToClipboard} disabled={!resultId} className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"><LinkIcon className="w-5 h-5 mr-2" /> {currentStrings.copyButton}</button><a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(generateShareText())}&url=${window.location.origin}/result/${resultId}`} target="_blank" rel="noopener noreferrer" className={`w-full flex items-center justify-center px-4 py-3 bg-black hover:bg-gray-800 text-white font-bold rounded-lg shadow-lg transition-colors ${!resultId ? 'pointer-events-none bg-gray-400' : ''}`}><svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>{currentStrings.shareTwitterButton}</a><a href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.origin}/result/${resultId}`} target="_blank" rel="noopener noreferrer" className={`w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-colors ${!resultId ? 'pointer-events-none bg-gray-400' : ''}`}><svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12Z" clipRule="evenodd"></path></svg>{currentStrings.shareFacebookButton}</a><a href={`https://www.linkedin.com/sharing/share-offsite/?url=${window.location.origin}/result/${resultId}`} target="_blank" rel="noopener noreferrer" className={`w-full flex items-center justify-center px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-lg transition-colors ${!resultId ? 'pointer-events-none bg-gray-400' : ''}`}><LinkedInIcon className="w-5 h-5 mr-2" />{currentStrings.shareLinkedInButton}</a><button onClick={handleCopyToClipboard} className={`w-full flex items-center justify-center px-4 py-3 text-white font-bold rounded-lg shadow-lg transition-colors bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:to-pink-600 ${!resultId ? 'opacity-50 cursor-not-allowed' : ''}`}><InstagramIcon className="w-5 h-5 mr-2" />{currentStrings.shareInstagramButton}</button></div><div className="mt-8 text-center"><button onClick={resetAllStates} className="w-auto flex items-center justify-center px-8 py-4 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-lg transition-colors text-lg"><RefreshCwIcon className="w-6 h-6 mr-3" /> {currentStrings.retryButton}</button></div>{copyStatus && <p className="text-center text-md text-green-700 mt-4 font-semibold animate-bounce">{copyStatus}</p>}</div>
                  </>
              )}
          </section>
      );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl mt-16 sm:mt-12 mb-8 text-center font-gaegu">
        {pageState === 'main' && (
          <div className="absolute top-4 right-4 z-20">
            <button onClick={() => setShowLanguageDropdown(!showLanguageDropdown)} className="flex items-center bg-white/30 text-white px-3 py-2 rounded-lg hover:bg-white/50 transition-colors duration-300 shadow-md"><GlobeIcon className="w-5 h-5 mr-2" />{currentStrings.languageSelectLabel}<ChevronDownIcon className={`w-5 h-5 ml-1 transform transition-transform duration-200 ${showLanguageDropdown ? 'rotate-180' : ''}`} /></button>
            {showLanguageDropdown && (<div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">{Object.keys(translations).map((langKey) => (<button key={langKey} type="button" onClick={() => selectLanguage(langKey)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" >{translations[langKey].languageName}</button>))}</div>)}
          </div>
        )}
        <h1 className="text-5xl sm:text-6xl font-bold text-white py-2 flex items-center justify-center drop-shadow-lg"><UsersIcon className="inline-block w-12 h-12 mr-3 text-pink-300" /><HeartIcon className="inline-block w-12 h-12 ml-3 text-red-400 animate-pulse" filled={true} /></h1>
        <p className="text-xl text-white mt-3 drop-shadow-md">{currentStrings.appSubtitle}</p>
        <p className="text-sm text-white/80 mt-1 drop-shadow-sm">{currentStrings.appDisclaimer}</p>
      </header>
      <main className="w-full max-w-4xl bg-white/95 backdrop-blur-md shadow-2xl rounded-xl p-6 sm:p-8">
        {isLoading && <AnalysisLoadingComponent image1={person1ImagePreview} image2={person2ImagePreview} strings={currentStrings} />}
        {isWatchingRewardedAd && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm w-full"><h3 className="text-xl font-semibold text-indigo-600 mb-3">{currentStrings.rewardedAdTitle}</h3><p className="text-gray-600 mb-5">{currentStrings.rewardedAdBody}</p><div className="w-full bg-gray-200 rounded-full h-2.5 mb-4"><div className="bg-indigo-600 h-2.5 rounded-full animate-pulse" style={{ width: "75%" }}></div></div><p className="text-sm text-gray-500">{currentStrings.rewardedAdFooter}</p></div></div>}
        {pageState === 'loadingResult' && <p className="text-center text-xl text-purple-700 font-semibold">{currentStrings.resultLoading}</p>}
        {!isLoading && pageState === 'main' && <MainPageComponent />}
        {!isLoading && pageState === 'resultView' && analysisResult && <ResultPageComponent />}
        {error && <p className="text-red-500 bg-red-100 border border-red-300 rounded-md p-4 text-md mt-4 max-w-md mx-auto shadow-md animate-shake">{error}</p>}
      </main>
      <footer className="w-full max-w-4xl mt-12 text-center">
        <p className="text-md text-white/90 drop-shadow-sm">{currentStrings.footerText.replace('{year}', new Date().getFullYear())}</p>
      </footer>
    </div>
  );
};

export default App;