import React, { useState, useCallback, useEffect } from 'react';

// 아이콘 정의
const UploadCloudIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
    <path d="M12 12v9"></path>
    <path d="m16 16-4-4-4 4"></path>
  </svg>
);
const HeartIcon = ({ className, filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);
const UsersIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);
const ThumbsUpIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M7 10v12"></path><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a2 2 0 0 1 3 1.88V5.88Z"></path></svg>
);
const ThumbsDownIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 14V2"></path><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a2 2 0 0 1-3-1.88V18.12Z"></path></svg>
);
const CopyIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
);
const PlayCircleIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
);
const RefreshCwIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>
);
const GlobeIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);
const ChevronDownIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);


// 다국어 텍스트 객체
const translations = {
  ko: {
    languageSelectLabel: "언어 변경",
    languageKorean: "한국어",
    languageEnglish: "English",
    languageJapanese: "日本語",
    languageChinese: "中文",
    languageSpanish: "Español",
    appTitle: "AI 커플 관상 궁합",
    appSubtitle: "사진만 올려봐! AI가 두 분의 운명적인 만남, 꿀잼으로 풀어드림! 😉",
    appDisclaimer: "(재미로 보는 거 알죠? 찡긋~☆)",
    physiognomyIntroTitle: "✨ '관상'이란 무엇일까요?",
    physiognomyIntroText: "'관상'은 얼굴 생김새를 통해 그 사람의 성격이나 운명을 파악하려는 동양의 전통적인 방법이에요. 이 앱은 재미를 위해 현대적인 AI 기술과 관상의 아이디어를 결합했답니다! 과학적 근거보다는 유쾌한 해석에 집중해주세요!",
    person1Title: "첫 번째 주인공",
    person2Title: "두 번째 주인공",
    uploadInstruction: "이목구비가 선명하게 잘 보이는<br/>정면 사진을 올려주세요!",
    uploadButton: "사진 올리기!",
    fileLoaded: "(로딩 완료!)",
    analyzeButton: "운명의 궁합 분석 시작!",
    loadingMessage: "AI가 열일 중! 🔥 거의 다 됐어요!",
    watchAdButton: "광고 보고 결과 확인! (두근두근)",
    errorMessageDefault: "두 분의 사진을 모두 업로드해주세요. 이목구비가 선명하게 나온 사진일수록 분석이 정확해요!",
    apiErrorGeneric: "API 요청에 실패했습니다",
    apiErrorResponseFormat: "AI가 응답을 준비하지 못했어요. 😥 응답 형식이 올바르지 않습니다. 잠시 후 다시 시도해주세요!",
    apiErrorJsonParse: "앗! AI가 너무 신나서 응답 형식을 살짝 실수했나 봐요. 😂 조금만 기다렸다가 다시 시도해주시면, 이번엔 꼭! 제대로 된 결과를 보여드릴게요!",
    apiErrorNetwork: "분석 중 얘기치 못한 오류가 발생했어요. 😭 네트워크 상태를 확인하고 다시 시도해주세요!",
    resultTitle: "💖 AI 꿀잼 관상 궁합 결과 💖",
    personAnalysisTitleSuffix: "님의 관상 총평! 🧐",
    compatibilityTitle: "두 분의 종합 궁합은 과연?! 💕",
    scoreUnit: "점!!!",
    scoreDefaultReason: "AI 왈: 이 점수는... 운명입니다! ✨",
    goodPointsTitle: "이런 점이 완전 찰떡궁합! 👍",
    improvementPointsTitle: "요것만 조심하면 백년해로 각! ⚠️",
    overallCommentTitle: "✨ AI의 종합 코멘트 ✨",
    defaultOverallComment: "AI 왈: 두 분, 그냥 결혼하세요! (농담 아님 😉)",
    adviceTitle: "💡 AI의 핵꿀잼 데이트 비법 전수! 💡",
    copyButton: "결과 복사해서 자랑하기!",
    shareTwitterButton: "트위터에 소문내기!",
    shareFacebookButton: "페북에도 알려주기!",
    retryButton: "첨부터 다시!",
    copySuccessMessage: "내용이 복사되었어요! 친구들에게 마구마구 자랑하세요! 💌",
    copyErrorMessage: "앗! 복사 기능을 사용하려면 브라우저 설정에서 클립보드 접근을 허용해야 할 수도 있어요! 😅",
    footerText: "© {year} AI 커플 관상 궁합 (꿀잼 총평판). 만든이도 꿀잼! 😉",
    interstitialAdTitle: "잠시만요! 🚀",
    interstitialAdBody1: "AI가 두 분의 운명적인 궁합을 빛의 속도로 분석 중이에요!",
    interstitialAdBody2: "(이 멋진 화면에 광고가 뿅! 나올 수도 있답니다 😉)",
    interstitialAdLoadingText: "운명의 데스티니 분석 중...",
    rewardedAdTitle: "✨ 특별한 결과 공개 임박! ✨",
    rewardedAdBody: "잠시 후 광고가 끝나면, 두 분의 놀라운 궁합 결과가 공개됩니다! (두근두근)",
    rewardedAdFooter: "광고는 스킵 없이! 곧 결과가 팡파레와 함께 등장! 팡! 🎉",
    placeholderImageText1: "첫+번째+분+사진",
    placeholderImageText2: "두+번째+분+사진",
    placeholderImageError: "앗!+사진이...+뿅!",
    adPlaceholderBannerText: "꿀잼+광고+배너",
    adPlaceholderInterstitialText: "두근두근+전면+광고",
    adPlaceholderRewardedText: "꿀잼+보상형+광고",
    aiPrompt: { // AI 프롬프트 내용은 이전과 동일하게 유지
      jsonFormatInstruction: "답변은 다음 JSON 형식으로 제공해주세요:",
      instruction: "두 분의 사진이 주어집니다. 각 인물의 전체적인 인상과 성격을 아주 재치 있고 성숙한 유머를 섞어, 마치 '인생 N회차 옆집 형/언니'가 핵심만 콕콕 짚어주듯 분석해주세요. 이때, 각 인물의 **가장 특징적인 이목구비 1~2가지만** 골라서, 그 관상학적 의미를 '아하!' 무릎을 탁 치게 만드는 비유나 유머로 풀어내고, 이것이 전체적인 성격 및 인생관과 어떻게 연결되는지 알려주세요. \"자, 어디 한번 볼까? 이분은 딱 보아하니~\" 같은 느낌으로요. 이 내용을 'overall_impression' 필드에 담아주세요. 분량은 각 사람당 3-4문장 정도로, 너무 가볍지도 무겁지도 않게! 그 후, 두 분의 궁합을 분석해주세요. 궁합 점수(0-100점)와 그 이유를 설명할 때는 \"긴장하시고~ 오늘의 커플 궁합 점수는 바로바로~!\" 처럼 기대감을 주면서도, 결과에 대해서는 '뼈 때리는' 한마디를 덧붙여주세요. 잘 맞는 점('good_points')과 서로 노력하면 좋을 점('areas_for_improvement')은 각각 2가지씩, 마치 '연애 고수'가 현실적인 팩폭과 따뜻한 응원을 동시에 날려주듯 작성해주세요. 예를 들어, '이것만 잘하면 할리우드 커플? 저리 가라 할 케미 폭발 각!' 이런 식으로요. 궁합 총평('overall_summary')은 한 편의 반전 있는 단편 영화 시놉시스처럼, 혹은 다음 화가 궁금해지는 인기 드라마의 명대사처럼 임팩트 있게 요약해주세요. 마지막으로 'advice' 필드에는 두 분이 함께하면 '이런 미친 짓까지 가능하다고?' 싶을 정도로 기상천외하고 재미있는 데이트 아이디어나, '이거 완전 우리 얘기잖아?' 싶은 관계 꿀팁 2가지를 제안해주세요. 모든 텍스트는 핵심을 찌르는 이모티콘(😏, 🔥, 🤣, 💡 등)을 적절히 사용하여 더욱 생동감 있게 만들어주세요!",
      person1NameExample: "첫 번째 분 별명 (예: 예측불가 자유영혼)",
      person1ImpressionExample: "오호~ 첫 번째 분, 딱 보니 보통내기가 아니시군요! 😏 자유분방함이 물씬 풍기는 눈빛과 살짝 올라간 입꼬리는 '내 사전에 불가능이란 없다!'를 외치는 듯한데요? 특히, 그 어디에도 얽매이지 않을 듯한 이마 라인은 '인생은 한 번뿐!' YOLO 정신을 제대로 보여줍니다. 덕분에 주변에 늘 신선한 영감을 주지만, 가끔 너무 즉흥적이라 '어디로 튈지 모르는 탱탱볼' 같다는 소리 좀 듣겠어요! 🤣",
      person2NameExample: "두 번째 분 별명 (예: 반전매력 철벽수비수)",
      person2ImpressionExample: "두 번째 분은 겉으로는 '접근금지' 아우라를 풍기는 철벽수비수 같지만, 알고 보면 속정이 깊은 반전매력의 소유자시네요! 🧐 반듯한 콧날과 다부진 입매는 '한번 마음먹은 건 끝까지 간다!'는 의지를 보여주지만, 의외의 순간에 보여주는 따뜻한 눈빛이 이분의 진짜 매력 포인트! 🔥 신중함도 좋지만, 가끔은 그 철벽, 살짝 내려놓고 달려보는 용기도 필요할 때가 있답니다!",
      compatibilityScoreReasonExample: "🎉 두구두구~ 이 커플, 궁합 점수는 무려 88점! 이거 완전 '환장의 커플'에서 '환상의 커플'로 진화 직전인데요?! 💕 서로 다른 매력이 만나 예상치 못한 시너지를 뿜어내는, 그야말로 '단짠단짠' 조합이랍니다! (근데 가끔 너무 짜거나 달아서 속 쓰릴 수 있음 주의! 😉)",
      goodPoint1Example: "첫 번째 분의 '일단 저지르고 보자!' 정신과 두 번째 분의 '돌다리도 부숴버릴 기세로 두드려보자!' 정신이 만나면? 세상에 없던 창조적인 결과물이 뙇! 어쩌면 세상을 바꿀지도? 💡",
      goodPoint2Example: "서로의 '덕질' 영역을 존중하다 못해 함께 빠져들다 보면, '어? 내가 이런 걸 좋아했었나?' 싶은 신세계를 경험하며 관계의 깊이가 남달라질 거예요! (단, 통장 잔고는 책임 못 짐 🤣)",
      improvementPoint1Example: "가끔 첫 번째 분이 너무 앞서나가서 두 번째 분이 '저기요, 잠깐만요!'를 외치기도 전에 저만치 가버리거나, 두 번째 분이 너무 신중해서 첫 번째 분이 '아, 속 터져! 내가 그냥 할게!'를 시전할 수 있어요. 서로의 '속도 조절' 능력 만렙 찍기가 시급합니다! 🚀",
      improvementPoint2Example: "표현 방식이 너무 달라서 '화성에서 온 남자, 금성에서 온 여자' 시즌2 찍을 뻔! 할 때가 있을 거예요. '척하면 척'도 좋지만, 가끔은 '말로 해야 압니다, 네?' 스킬도 장착해야 서로 오해 없이 오래오래 행복할 수 있어요! 💬",
      overallSummaryExample: "이 커플, 한마디로 '예측불가 롤러코스터'입니다! 🎢 조용할 날 없이 티격태격하면서도 서로 없이는 못 사는, 그런 애증(?)의 관계랄까요? 하지만 분명한 건, 두 분의 삶은 서로로 인해 훨씬 더 다채롭고 유쾌해질 거라는 사실! 지루함은 저 멀리 안드로메다로 보내버리고, 이 스릴 넘치는 여정을 마음껏 즐겨보시길! 🔥",
      advice1Example: "둘만의 '아무 말 대잔치 데이트'는 어때요? 하루 동안 서로에게 떠오르는 아무 말이나 필터 없이 던져보는 거예요! (단, 끝나고 뒤끝 없기! 🤙) 의외의 진심이나 빵 터지는 유머를 발견할지도 몰라요!",
      advice2Example: "서로의 '흑역사 배틀'을 열어보세요! 가장 창피했던 과거 사진이나 에피소드를 공유하며 누가 더 강력한 흑역사를 가졌는지 겨뤄보는 거죠! 웃다가 눈물 콧물 다 쏟아도 책임 안 집니다! 😂 이 과정을 통해 서로의 인간적인 매력에 더 깊이 빠져들 거예요!",
      languageInstructionSuffix: "모든 설명은 선택된 언어(한국어)로 매우 친근하고 재미있게, 유머와 긍정적인 에너지를 담아 작성해주세요."
    }
  },
  en: {
    languageSelectLabel: "Change Language",
    languageKorean: "한국어",
    languageEnglish: "English",
    languageJapanese: "日本語",
    languageChinese: "中文",
    languageSpanish: "Español",
    appTitle: "AI Couple Face Reading Compatibility",
    appSubtitle: "Just upload photos! AI will hilariously analyze your fateful encounter! 😉",
    appDisclaimer: "(Just for fun, you know? Wink~☆)",
    physiognomyIntroTitle: "✨ What is 'Face Reading' (Physiognomy)?",
    physiognomyIntroText: "'Face Reading' (Physiognomy) is a traditional Eastern practice of discerning a person's character or destiny from their facial features. This app combines the idea of physiognomy with modern AI for fun! Please focus on the playful interpretations rather than scientific accuracy!",
    person1Title: "First Protagonist",
    person2Title: "Second Protagonist",
    uploadInstruction: "Please upload clear front-facing photos<br/>where facial features are distinct!",
    uploadButton: "Upload Photo!",
    fileLoaded: "(Loaded!)",
    analyzeButton: "Analyze Destiny's Compatibility!",
    loadingMessage: "AI is working hard! 🔥 Almost there!",
    watchAdButton: "Watch Ad to See Results! (Exciting!)",
    errorMessageDefault: "Please upload photos of both individuals. Clearer photos with distinct facial features lead to more accurate analysis!",
    apiErrorGeneric: "API request failed",
    apiErrorResponseFormat: "AI couldn't prepare a response. 😥 The response format is incorrect. Please try again shortly!",
    apiErrorJsonParse: "Oops! The AI got a bit too excited and made a slight mistake with the response format. 😂 Please wait a moment and try again, and it'll surely show you the proper results this time!",
    apiErrorNetwork: "An unexpected error occurred during analysis. 😭 Please check your network connection and try again!",
    resultTitle: "💖 AI Fun Face Reading Compatibility Results 💖",
    personAnalysisTitleSuffix: "'s Face Reading Analysis! 🧐",
    compatibilityTitle: "What's The Overall Compatibility?! 💕",
    scoreUnit: "Points!!!",
    scoreDefaultReason: "AI says: This score... is destiny! ✨",
    goodPointsTitle: "These Points Are a Perfect Match! 👍",
    improvementPointsTitle: "Just Be Careful With This, and You're Set for Life! ⚠️",
    overallCommentTitle: "✨ AI's Overall Comment ✨",
    defaultOverallComment: "AI says: You two, just get married! (Not kidding 😉)",
    adviceTitle: "💡 AI's Super Fun Date Secrets! 💡",
    copyButton: "Copy Results & Show Off!",
    shareTwitterButton: "Spread the Word on Twitter!",
    shareFacebookButton: "Tell Facebook Friends Too!",
    retryButton: "Start Over!",
    copySuccessMessage: "Content copied! Go ahead and boast to your friends! 💌",
    copyErrorMessage: "Oops! To use the copy feature, you might need to allow clipboard access in your browser settings! 😅",
    footerText: "© {year} AI Couple Face Reading Compatibility (Fun Edition). The creator had fun too! 😉",
    interstitialAdTitle: "Just a Moment! 🚀",
    interstitialAdBody1: "AI is analyzing your fateful compatibility at the speed of light!",
    interstitialAdBody2: "(An awesome ad might pop up on this cool screen 😉)",
    interstitialAdLoadingText: "Analyzing destiny...",
    rewardedAdTitle: "✨ Special Results Unveiling Soon! ✨",
    rewardedAdBody: "Once the ad finishes, your amazing compatibility results will be revealed! (Heart-pounding!)",
    rewardedAdFooter: "No skipping ads! Results will appear with a fanfare soon! Boom! 🎉",
    placeholderImageText1: "Person+1+Photo",
    placeholderImageText2: "Person+2+Photo",
    placeholderImageError: "Oops!+Image+Error!",
    adPlaceholderBannerText: "Fun+Ad+Banner",
    adPlaceholderInterstitialText: "Exciting+Interstitial+Ad",
    adPlaceholderRewardedText: "Fun+Rewarded+Ad",
    aiPrompt: {
      jsonFormatInstruction: "Please provide the answer in the following JSON format:",
      instruction: "You will be given two photos. Analyze each person's overall impression and personality with witty and mature humor, as if a 'life-savvy older sibling' is giving a spot-on analysis. For this, pick **only 1-2 most distinctive facial features** of each person, explain their physiognomic meaning with 'aha!' moment analogies or humor, and how it connects to their overall personality and outlook on life. Like, \"Alright, let's see... This person clearly is~\". Put this in the 'overall_impression' field. Keep it to 3-4 sentences per person, not too light, not too heavy! Then, analyze their compatibility. When explaining the compatibility score (0-100) and reasons, build anticipation like \"Tension building~ Today's couple compatibility score is...!\" and add a 'hard-hitting' comment about the result. For 'good_points' and 'areas_for_improvement', provide two each, as if a 'dating guru' is dishing out realistic truths and warm encouragement simultaneously. For example, 'If you nail this, Hollywood couples? Step aside, your chemistry will be explosive!'. Summarize the 'overall_summary' impactfully, like a synopsis of a short film with a twist, or a memorable line from a hit drama that leaves you wanting more. Lastly, in the 'advice' field, suggest 2 outrageously fun date ideas or relationship tips that make them think 'We can do crazy stuff like this?' or 'This is totally us!'. Use fitting emojis (😏, 🔥, 🤣, 💡, etc.) appropriately to make all text more lively!",
      person1NameExample: "First person's nickname (e.g., Unpredictable Free Spirit)",
      person1ImpressionExample: "Oh ho~ First person, you're clearly no ordinary individual! 😏 A free-spirited vibe emanates from your eyes and slightly upturned lips, as if shouting 'Impossible is not in my dictionary!'? Especially, that forehead line, seemingly unbound by anything, truly shows a 'You Only Live Once!' YOLO spirit. Thanks to this, you always bring fresh inspiration to those around you, but sometimes you're so spontaneous, you might hear that you're like an 'unpredictable bouncy ball'! 🤣",
      person2NameExample: "Second person's nickname (e.g., Stoic Defender with a Twist)",
      person2ImpressionExample: "The second person seems like a stoic defender emitting a 'keep out' aura, but is actually a person of deep affection with a surprising twist! 🧐 That straight nose bridge and firm mouth show a will of 'Once I decide, I see it through!', but the warm gaze shown in unexpected moments is this person's real charm point! 🔥 Being cautious is good, but sometimes you need the courage to lower that guard and just go for it!",
      compatibilityScoreReasonExample: "🎉 Drumroll, please! This couple's compatibility score is a whopping 88 points! Is this evolving from a 'disaster couple' to a 'fantastic couple'?! 💕 Different charms meet to create unexpected synergy, a truly 'sweet and salty' combination! (But be warned, it might get too salty or too sweet and cause some heartburn! 😉)",
      goodPoint1Example: "When the first person's 'Let's just do it!' spirit meets the second person's 'Let's test this bridge like we're gonna break it!' mentality? An unprecedented creative outcome, BAM! It might even change the world! 💡",
      goodPoint2Example: "By respecting, and even diving into, each other's 'fandoms,' you'll discover a whole new world like, 'Huh? Did I like this stuff?' and the depth of your relationship will be extraordinary! (No responsibility for bank account balances 🤣)",
      improvementPoint1Example: "Sometimes, the first person might dash off so far ahead that the second person can't even shout 'Hey, wait up!' or the second person is so cautious that the first person exclaims, 'Ugh, so frustrating! I'll just do it myself!' Leveling up your 'pacing' skills is urgent! 🚀",
      improvementPoint2Example: "Your ways of expression are so different, you might almost film 'Men Are from Mars, Women Are from Venus' Season 2! 'Reading each other's minds' is great, but sometimes you need to equip the 'You gotta say it out loud, okay?' skill to be happy together for a long, long time without misunderstandings! 💬",
      overallSummaryExample: "This couple, in one word, is an 'Unpredictable Rollercoaster'! 🎢 Bickering nonstop but unable to live without each other, a love-hate(?) relationship, perhaps? But one thing's for sure, your lives will become much more colorful and joyful because of each other! Send boredom patterns to Andromeda and enjoy this thrilling journey to the fullest! 🔥",
      advice1Example: "How about a 'Gibberish Extravaganza Date'? For one day, just throw any random thoughts at each other without a filter! (But no hard feelings afterwards! 🤙) You might discover unexpected sincerity or burst-out-laughing humor!",
      advice2Example: "Hold an 'Embarrassing Past Battle'! Share your most shameful old photos or episodes and compete to see who has the more potent embarrassing history! No responsibility if you cry-laugh your eyes out! 😂 Through this process, you'll fall even deeper for each other's human charms!",
      languageInstructionSuffix: "All descriptions should be written in the selected language (English) in a very friendly, fun, and humorous tone, full of positive energy."
    }
  },
  ja: {
    languageSelectLabel: "言語変更",
    languageKorean: "한국어",
    languageEnglish: "English",
    languageJapanese: "日本語",
    languageChinese: "中文",
    languageSpanish: "Español",
    appTitle: "AIカップル観相相性診断",
    appSubtitle: "写真をアップロードするだけ！AIが二人の運命的な出会いを面白おかしく分析します！😉",
    appDisclaimer: "（楽しむためのものですよ？ウィンク～☆）",
    physiognomyIntroTitle: "✨ 「観相」とは？",
    physiognomyIntroText: "「観相」とは、顔立ちからその人の性格や運命を読み解こうとする東洋の伝統的な方法です。このアプリは、楽しむために現代のAI技術と観相のアイデアを組み合わせています！科学的根拠よりも、愉快な解釈に注目してくださいね！",
    person1Title: "最初の主人公",
    person2Title: "二番目の主人公",
    uploadInstruction: "目鼻立ちがはっきりわかる<br/>正面写真をアップロードしてください！",
    uploadButton: "写真アップロード！",
    fileLoaded: "（読込完了！）",
    analyzeButton: "運命の相性分析スタート！",
    loadingMessage: "AIが頑張って分析中！🔥もうすぐです！",
    watchAdButton: "広告を見て結果を確認！（ドキドキ）",
    errorMessageDefault: "お二人の写真を両方アップロードしてください。目鼻立ちがはっきりした写真ほど分析が正確になります！",
    apiErrorGeneric: "APIリクエストに失敗しました",
    apiErrorResponseFormat: "AIが応答を準備できませんでした。😥 応答形式が正しくありません。しばらくしてからもう一度お試しください！",
    apiErrorJsonParse: "おっと！AIが興奮しすぎて応答形式を少し間違えたようです。😂 少し待ってからもう一度試していただければ、今度こそちゃんとした結果をお見せします！",
    apiErrorNetwork: "分析中に予期せぬエラーが発生しました。😭 ネットワーク接続を確認して、もう一度お試しください！",
    resultTitle: "💖 AI爆笑観相相性結果 💖",
    personAnalysisTitleSuffix: "さんの観相総合評価！🧐",
    compatibilityTitle: "お二人の総合的な相性はいかに？！💕",
    scoreUnit: "点！！！",
    scoreDefaultReason: "AI曰く：この点数は…運命です！✨",
    goodPointsTitle: "こんなところが相性バッチリ！👍",
    improvementPointsTitle: "ここだけ気をつければ百年の恋も！⚠️",
    overallCommentTitle: "✨ AIの総合コメント ✨",
    defaultOverallComment: "AI曰く：お二人、もう結婚しちゃいなよ！（冗談じゃなく😉）",
    adviceTitle: "💡 AIのマル秘デート術伝授！💡",
    copyButton: "結果をコピーして自慢しよう！",
    shareTwitterButton: "Twitterで広めよう！",
    shareFacebookButton: "Facebookでも知らせよう！",
    retryButton: "最初からやり直す！",
    copySuccessMessage: "内容がコピーされました！友達にどんどん自慢しちゃいましょう！💌",
    copyErrorMessage: "おっと！コピー機能を使用するには、ブラウザの設定でクリップボードへのアクセスを許可する必要があるかもしれません！😅",
    footerText: "© {year} AIカップル観相相性診断（爆笑総評版）。作った人も爆笑！😉",
    interstitialAdTitle: "少々お待ちください！🚀",
    interstitialAdBody1: "AIが光の速さでお二人の運命の相性を分析中です！",
    interstitialAdBody2: "（この素敵な画面に広告がポン！と出るかもしれません😉）",
    interstitialAdLoadingText: "運命のデスティニー分析中…",
    rewardedAdTitle: "✨ 特別な結果公開間近！✨",
    rewardedAdBody: "広告が終わると、お二人の驚きの相性結果が公開されます！（ドキドキ）",
    rewardedAdFooter: "広告はスキップなし！もうすぐ結果がファンファーレと共に登場！ジャーン！🎉",
    placeholderImageText1: "一人目の写真",
    placeholderImageText2: "二人目の写真",
    placeholderImageError: "あれ！画像エラー！",
    adPlaceholderBannerText: "楽しい広告バナー",
    adPlaceholderInterstitialText: "ドキドキ全面広告",
    adPlaceholderRewardedText: "楽しいリワード広告",
    aiPrompt: {
      jsonFormatInstruction: "回答は以下のJSON形式で提供してください：",
      instruction: "お二人の写真が与えられます。各人物の全体的な印象と性格を、まるで「人生経験豊富な隣のお兄さん/お姉さん」が核心を突くように、非常にウィットに富んだ成熟したユーモアを交えて分析してください。その際、各人物の**最も特徴的な目鼻立ち1～2点のみ**を選び、その観相学的な意味を「なるほど！」と膝を打つような比喩やユーモアで解説し、それが全体的な性格や人生観とどう結びつくかを教えてください。「さて、どれどれ？この方はどう見ても～」といった感じで。この内容を「overall_impression」フィールドに含めてください。分量は各人3～4文程度で、軽すぎず重すぎないように！その後、お二人の相性を分析してください。相性点（0～100点）とその理由を説明する際は、「緊張して～本日のカップル相性点はズバリ～！」のように期待感を高めつつ、結果については「核心を突く」一言を添えてください。「good_points」（良い点）と「areas_for_improvement」（改善点）はそれぞれ2つずつ、「恋愛の達人」が現実的な指摘と温かい応援を同時に送るように記述してください。例えば、「これさえうまくいけばハリウッドカップル？目じゃないほどのケミストリー爆発間違いなし！」のように。相性の総括（「overall_summary」）は、どんでん返しのある短編映画のあらすじのように、あるいは次が気になる人気ドラマの名台詞のようにインパクト 있게まとめてください。最後に、「advice」フィールドには、お二人が一緒にやると「こんなクレイジーなことまでできるの？」と思うほど奇想天外で面白いデートのアイデアや、「これって完全に私たちのことじゃん？」と思うような関係の秘訣を2つ提案してください。すべてのテキストには、核心を突く絵文字（😏、🔥、🤣、💡など）を適切に使用して、より生き生きとさせてください！",
      person1NameExample: "一人目のニックネーム（例：予測不能な自由人）",
      person1ImpressionExample: "おやおや～一人目の方、どう見ても普通の方じゃありませんね！😏自由奔放さが漂う目つきと少し上がった口角は、「私の辞書に不可能という文字はない！」と叫んでいるかのよう。特に、何にも縛られないような額のラインは、「人生は一度きり！」YOLO精神をしっかり見せています。おかげで周りにはいつも新鮮なインスピレーションを与えますが、時々突拍子もなさすぎて「どこに飛んでいくかわからないスーパーボール」みたいって言われちゃいますね！🤣",
      person2NameExample: "二人目のニックネーム（例：ギャップ萌え鉄壁ガードマン）",
      person2ImpressionExample: "二人目の方は、表向きは「接近禁止」オーラを放つ鉄壁ガードマンのようですが、実は情に厚いギャップ萌えの持ち主ですね！🧐通った鼻筋と引き締まった口元は、「一度決めたことは最後までやり通す！」という意志を示していますが、ふとした瞬間に見せる温かい眼差しがこの方の真の魅力ポイント！🔥慎重さもいいですが、たまにはその鉄壁、少しだけ下ろして突っ走ってみる勇気も必要ですよ！",
      compatibilityScoreReasonExample: "🎉 ドキドキ～このカップル、相性点はなんと88点！これぞまさに「破滅型カップル」から「最高のカップル」への進化直前？！💕異なる魅力が出会って予想外のシナジーを生み出す、まさに「甘じょっぱい」組み合わせです！（でも時々しょっぱすぎたり甘すぎたりして胸焼けするかもなので注意！😉）",
      goodPoint1Example: "一人目の「とりあえずやってみよう！」精神と二人目の「石橋も叩き壊す勢いで叩いてみよう！」精神が出会ったら？世にもなかった創造的な結果がドーン！もしかしたら世界を変えちゃうかも？💡",
      goodPoint2Example: "お互いの「オタ活」領域を尊重するどころか一緒にハマってしまったら、「あれ？私こんなの好きだったっけ？」と思うような新世界を経験し、関係の深さが格段にアップするでしょう！（ただし、通帳残高は保証できません🤣）",
      improvementPoint1Example: "時々一人目が先走りすぎて二人目が「ちょっと、待って！」と叫ぶ間もなく彼方へ行ってしまったり、二人目が慎重すぎて一人目が「あー、もうイライラする！私がやる！」と実力行使に出ることがあるかもしれません。お互いの「ペース調整」能力をマックスレベルにすることが急務です！🚀",
      improvementPoint2Example: "表現方法があまりにも違いすぎて、「火星から来た男、金星から来た女」シーズン2を撮りそうになることがあるでしょう。「あうんの呼吸」もいいですが、たまには「言葉にしないと分かりませんよ、ね？」スキルも装備しないと、誤解なく末永く幸せにはなれません！💬",
      overallSummaryExample: "このカップル、一言で言うと「予測不能なジェットコースター」です！🎢静かな日とてなくいがみ合いながらも、お互いなしでは生きられない、そんな愛憎（？）の関係とでも言いましょうか？でも確かなのは、お二人の人生はお互いによってずっと色彩豊かで愉快になるということ！退屈はアンドロメダの彼方に送って、このスリル満点の旅を存分に楽しんでください！🔥",
      advice1Example: "二人だけの「何でもありデタラメデート」はいかが？一日中、お互いに思いつくままの言葉をフィルターなしで投げかけ合うんです！（ただし、終わった後は根に持たないこと！🤙）意外な本音や爆笑ユーモアを発見できるかも！",
      advice2Example: "お互いの「黒歴史バトル」を開いてみましょう！一番恥ずかしい過去の写真やエピソードを共有して、どっちがより強力な黒歴史を持っているか競うんです！笑いすぎて涙と鼻水が出ても責任は取りません！😂この過程を通じて、お互いの人間的な魅力にもっと深く惹かれることでしょう！",
      languageInstructionSuffix: "すべての説明は選択された言語（日本語）で、非常に親しみやすく面白く、ユーモアとポジティブなエネルギーを込めて記述してください。"
    }
  },
  zh: {
    languageSelectLabel: "更改语言",
    languageKorean: "한국어",
    languageEnglish: "English",
    languageJapanese: "日本語",
    languageChinese: "中文",
    languageSpanish: "Español",
    appTitle: "AI情侣面相八字合婚",
    appSubtitle: "只需上传照片！AI将为您风趣解读你们的命运邂逅！😉",
    appDisclaimer: "（仅供娱乐，你懂的？찡긋~☆）",
    physiognomyIntroTitle: "✨ 什么是“面相”？",
    physiognomyIntroText: "“面相”是一种通过观察面部特征来判断个人性格或命运的东方传统方法。本应用结合了面相的理念和现代AI技术，旨在提供娱乐！请更关注有趣的解读而非科学准确性哦！",
    person1Title: "第一主角",
    person2Title: "第二主角",
    uploadInstruction: "请上传五官清晰的<br/>正面照片！",
    uploadButton: "上传照片！",
    fileLoaded: "（加载完毕！）",
    analyzeButton: "开始分析命运八字！",
    loadingMessage: "AI正在努力工作中！🔥 就快好了！",
    watchAdButton: "观看广告查看结果！（激动！）",
    errorMessageDefault: "请上传双方的照片。五官越清晰，分析越准确！",
    apiErrorGeneric: "API请求失败",
    apiErrorResponseFormat: "AI未能准备好回应。😥 回应格式不正确。请稍后再试！",
    apiErrorJsonParse: "哎呀！AI太兴奋了，回应格式出了点小差错。😂 请稍等片刻再试一次，这次一定能给您看正确的结果！",
    apiErrorNetwork: "分析过程中发生意外错误。😭 请检查您的网络连接并重试！",
    resultTitle: "💖 AI趣味面相八字合婚结果 💖",
    personAnalysisTitleSuffix: "的面相总评！🧐",
    compatibilityTitle: "两位的综合八字究竟如何？！💕",
    scoreUnit: "分！！！",
    scoreDefaultReason: "AI说：这个分数…是命运啊！✨",
    goodPointsTitle: "这些方面简直是天作之合！👍",
    improvementPointsTitle: "注意这点就能白头偕老！⚠️",
    overallCommentTitle: "✨ AI综合点评 ✨",
    defaultOverallComment: "AI说：你们俩，原地结婚吧！（不开玩笑😉）",
    adviceTitle: "💡 AI的趣味约会秘诀大公开！💡",
    copyButton: "复制结果去炫耀！",
    shareTwitterButton: "在推特上分享！",
    shareFacebookButton: "也告诉脸书好友！",
    retryButton: "从头开始！",
    copySuccessMessage: "内容已复制！快去向朋友们炫耀吧！💌",
    copyErrorMessage: "哎呀！要使用复制功能，您可能需要在浏览器设置中允许访问剪贴板！😅",
    footerText: "© {year} AI情侣面相八字合婚（趣味总评版）。开发者也玩得很开心！😉",
    interstitialAdTitle: "请稍候！🚀",
    interstitialAdBody1: "AI正在以光速分析两位的命运八字！",
    interstitialAdBody2: "（这个酷炫的界面上可能会弹出广告哦😉）",
    interstitialAdLoadingText: "命运分析中…",
    rewardedAdTitle: "✨ 特别结果即将揭晓！✨",
    rewardedAdBody: "广告结束后，您二位的惊人八字结果即将公开！（心跳加速）",
    rewardedAdFooter: "广告不可跳过！结果即将伴随华丽音效登场！嘭！🎉",
    placeholderImageText1: "第一人照片",
    placeholderImageText2: "第二人照片",
    placeholderImageError: "哎呀！图片错误！",
    adPlaceholderBannerText: "趣味广告横幅",
    adPlaceholderInterstitialText: "激动人心的插页广告",
    adPlaceholderRewardedText: "趣味奖励广告",
    aiPrompt: {
      jsonFormatInstruction: "请用以下JSON格式提供答案：",
      instruction: "将提供两张照片。请用机智且成熟的幽默感分析每个人的整体印象和性格，仿佛一位“人生经验丰富的老大哥/大姐”在给出精准的分析。为此，请挑选每个人**最突出的1-2个面部特征**，用令人恍然大悟的比喻或幽默来解释其面相学意义，以及它如何与他们的整体性格和人生观联系起来。例如：“好吧，让我看看……这个人显然是～”。请将此内容放入“overall_impression”字段。每人3-4句话，不要太轻浮，也不要太沉重！然后，分析他们的匹配度。在解释匹配度分数（0-100分）和原因时，要营造悬念，例如：“紧张起来～今天的情侣匹配度分数是……！”并对结果加上一句“切中要害”的评论。对于“good_points”（优点）和“areas_for_improvement”（待改进之处），各提供两点，仿佛一位“约会大师”同时给出真实的反馈和热情的鼓励。例如：“如果你们能做到这一点，好莱坞情侣？算了吧，你们的化学反应将是爆炸性的！”。请像一部带有反转的短片概要，或一部引人入胜的热播剧的难忘台词一样，有冲击力地总结“overall_summary”（总体概要）。最后，在“advice”（建议）字段中，提出2个离奇有趣的约会点子或关系技巧，让他们觉得“我们居然能做这么疯狂的事？”或“这完全说的就是我们！”。请适当使用切题的表情符号（😏、🔥、🤣、💡等），使所有文本更加生动！",
      person1NameExample: "第一个人的昵称（例如：难以预测的自由灵魂）",
      person1ImpressionExample: "哦豁～第一位，您可真不是一般人！😏眼神和微微上扬的嘴角都透着一股子自由不羁，仿佛在高喊“我的字典里没有不可能！”特别是那无拘无束的额头线条，简直是“人生得意须尽欢”YOLO精神的完美体现。因此您总能给周围人带来新鲜灵感，但偶尔也因为太过随性，可能会被说成像个“行走的弹力球”哦！🤣",
      person2NameExample: "第二个人的昵称（例如：反差萌铁壁守卫）",
      person2ImpressionExample: "第二位表面上看起来像个散发着“生人勿近”气场的铁壁守卫，实际上却是个内心火热、充满反差萌的家伙！🧐那端正的鼻梁和坚毅的唇形，无不透露出“一旦决定，势必达成”的决心，但在不经意间流露出的温暖眼神才是这位真正的魅力所在！🔥沉稳固然好，但偶尔也需要鼓起勇气，稍稍放下那份戒备，大胆尝试一下嘛！",
      compatibilityScoreReasonExample: "🎉 咚咚咚～这对情侣，匹配度高达88分！这简直是从“冤家路窄”进化到“神仙眷侣”的前奏啊？！💕不同的魅力碰撞出意想不到的火花，妥妥的“甜辣酱”组合！（不过偶尔太辣或太甜可能会伤胃，请注意！😉）",
      goodPoint1Example: "当第一位的“先干为敬！”精神遇上第二位的“过河拆桥般谨慎！”态度，会怎样？一个前所未有的创意成果，Duang！说不定还能改变世界呢！💡",
      goodPoint2Example: "互相尊重甚至沉迷于对方的“爱好圈子”，你们会发现一个全新的世界，惊呼“啊？原来我喜欢这个？”从而让感情深度非同凡响！（友情提示：钱包厚度概不负责🤣）",
      improvementPoint1Example: "有时第一位可能冲得太快，第二位还没来得及喊“喂，等等！”，人已经没影了；或者第二位过于谨慎，导致第一位直接上手“唉，急死我了！我自己来！”。看来双方的“步调协调”能力急需满级！🚀",
      improvementPoint2Example: "你们的表达方式差异太大，简直可以拍一部《来自火星的男人，来自金星的女人》续集了！“心有灵犀”固然好，但有时也需要装备“有话直说，好吗？”技能，才能减少误会，长长久久地幸福下去！💬",
      overallSummaryExample: "这对情侣，一言以蔽之，“难以预测的过山车”！🎢三天两头吵吵闹闹，却又谁也离不开谁，这大概就是所谓的“相爱相杀”吧？但可以肯定的是，你们的人生会因为对方而变得更加多姿多彩、充满乐趣！把无聊抛到九霄云外，尽情享受这场惊险刺激的旅程吧！🔥",
      advice1Example: "来一场“畅所欲言放飞自我”约会怎么样？一天之内，想到什么就对彼此说什么，无需任何过滤！（前提是：事后不准翻旧账！🤙）说不定能发现意想不到的真心话或爆笑梗哦！",
      advice2Example: "举办一场“黑历史大比拼”吧！分享彼此最糗的旧照或糗事，看谁的黑历史更胜一筹！笑出眼泪鼻涕概不负责！😂通过这个过程，你们会更深地迷恋上对方充满人情味的魅力！",
      languageInstructionSuffix: "所有描述都应使用所选语言（中文）以非常友好、有趣和幽默的口吻书写，充满正能量。"
    }
  },
  es: {
    languageSelectLabel: "Cambiar Idioma",
    languageKorean: "한국어",
    languageEnglish: "English",
    languageJapanese: "日本語",
    languageChinese: "中文",
    languageSpanish: "Español",
    appTitle: "IA Compatibilidad de Parejas por Lectura Facial",
    appSubtitle: "¡Solo sube las fotos! ¡La IA analizará vuestro fatídico encuentro de forma divertidísima! 😉",
    appDisclaimer: "(Solo por diversión, ¿sabes? Guiño~☆)",
    physiognomyIntroTitle: "✨ ¿Qué es la 'Lectura Facial' (Fisiognomía)?",
    physiognomyIntroText: "La 'Lectura Facial' (Fisiognomía) es una práctica tradicional oriental de discernir el carácter o el destino de una persona a partir de sus rasgos faciales. ¡Esta aplicación combina la idea de la fisiognomía con la IA moderna para divertirse! ¡Por favor, céntrate en las interpretaciones lúdicas en lugar de la precisión científica!",
    person1Title: "Primer Protagonista",
    person2Title: "Segundo Protagonista",
    uploadInstruction: "¡Sube fotos frontales claras<br/>donde los rasgos faciales se distingan bien!",
    uploadButton: "¡Subir Foto!",
    fileLoaded: "(¡Cargado!)",
    analyzeButton: "¡Analizar Compatibilidad del Destino!",
    loadingMessage: "¡La IA está trabajando duro! 🔥 ¡Casi listo!",
    watchAdButton: "¡Ver Anuncio para Ver Resultados! (¡Emocionante!)",
    errorMessageDefault: "Por favor, sube las fotos de ambas personas. ¡Fotos más claras con rasgos faciales distintivos llevan a un análisis más preciso!",
    apiErrorGeneric: "Falló la solicitud a la API",
    apiErrorResponseFormat: "La IA no pudo preparar una respuesta. 😥 El formato de respuesta es incorrecto. ¡Por favor, inténtalo de nuevo en breve!",
    apiErrorJsonParse: "¡Uy! La IA se emocionó demasiado y cometió un pequeño error con el formato de respuesta. 😂 Por favor, espera un momento e inténtalo de nuevo, ¡y seguro que esta vez te mostrará los resultados correctos!",
    apiErrorNetwork: "Ocurrió un error inesperado durante el análisis. 😭 ¡Por favor, revisa tu conexión de red e inténtalo de nuevo!",
    resultTitle: "💖 Resultados Divertidos de Compatibilidad Facial por IA 💖",
    personAnalysisTitleSuffix: " ¡Análisis de Lectura Facial! 🧐",
    compatibilityTitle: "¿Cuál es la Compatibilidad General?! 💕",
    scoreUnit: "¡¡¡Puntos!!!",
    scoreDefaultReason: "La IA dice: Esta puntuación... ¡es el destino! ✨",
    goodPointsTitle: "¡Estos Puntos Son una Combinación Perfecta! 👍",
    improvementPointsTitle: "¡Solo Cuidado Con Esto, y Estaréis Listos para Siempre! ⚠️",
    overallCommentTitle: "✨ Comentario General de la IA ✨",
    defaultOverallComment: "La IA dice: Vosotros dos, ¡casaos ya! (No es broma 😉)",
    adviceTitle: "💡 ¡Secretos de Citas Súper Divertidas de la IA! 💡",
    copyButton: "¡Copiar Resultados y Presumir!",
    shareTwitterButton: "¡Difúndelo en Twitter!",
    shareFacebookButton: "¡Cuéntaselo también a tus amigos de Facebook!",
    retryButton: "¡Empezar de Nuevo!",
    copySuccessMessage: "¡Contenido copiado! ¡Ve y presume ante tus amigos! 💌",
    copyErrorMessage: "¡Uy! Para usar la función de copiar, ¡quizás necesites permitir el acceso al portapapeles en la configuración de tu navegador! 😅",
    footerText: "© {year} IA Compatibilidad de Parejas por Lectura Facial (Edición Divertida). ¡El creador también se divirtió! 😉",
    interstitialAdTitle: "¡Un Momento! 🚀",
    interstitialAdBody1: "¡La IA está analizando vuestra compatibilidad fatídica a la velocidad de la luz!",
    interstitialAdBody2: "(Un anuncio increíble podría aparecer en esta pantalla genial 😉)",
    interstitialAdLoadingText: "Analizando el destino...",
    rewardedAdTitle: "✨ ¡Resultados Especiales se Revelarán Pronto! ✨",
    rewardedAdBody: "Una vez que termine el anuncio, ¡se revelarán vuestros asombrosos resultados de compatibilidad! (¡ emocionante!)",
    rewardedAdFooter: "¡Sin saltar anuncios! ¡Los resultados aparecerán con fanfarria pronto! ¡Pum! 🎉",
    placeholderImageText1: "Foto+Persona+1",
    placeholderImageText2: "Foto+Persona+2",
    placeholderImageError: "¡Uy!+Error+de+Imagen",
    adPlaceholderBannerText: "Banner+de+Anuncio+Divertido",
    adPlaceholderInterstitialText: "Anuncio+Intersticial+Emocionante",
    adPlaceholderRewardedText: "Anuncio+Recompensado+Divertido",
    aiPrompt: {
      jsonFormatInstruction: "Por favor, proporciona la respuesta en el siguiente formato JSON:",
      instruction: "Se te darán dos fotos. Analiza la impresión general y la personalidad de cada persona con humor ingenioso y maduro, como si un 'hermano/a mayor sabio/a de la vida' estuviera dando un análisis preciso. Para esto, elige **solo 1-2 rasgos faciales más distintivos** de cada persona, explica su significado fisonómico con analogías o humor que provoquen un momento '¡ajá!', y cómo se conecta con su personalidad general y su visión de la vida. Como, \"Bien, veamos... Esta persona claramente es~\". Pon esto en el campo 'overall_impression'. Que sea de 3-4 frases por persona, ¡ni muy ligero, ni muy pesado! Luego, analiza su compatibilidad. Al explicar la puntuación de compatibilidad (0-100) y las razones, crea expectación como \"¡Aumenta la tensión~ La puntuación de compatibilidad de la pareja de hoy es...!\" y añade un comentario 'contundente' sobre el resultado. Para 'good_points' (puntos buenos) y 'areas_for_improvement' (áreas de mejora), proporciona dos de cada uno, como si un 'gurú de las citas' estuviera repartiendo verdades realistas y ánimo cálido simultáneamente. Por ejemplo, 'Si lográis esto, ¿parejas de Hollywood? ¡Apartaos, vuestra química será explosiva!'. Resume el 'overall_summary' (resumen general) de forma impactante, como la sinopsis de un cortometraje con un giro, o una frase memorable de una serie de éxito que te deje con ganas de más. Por último, en el campo 'advice' (consejo), sugiere 2 ideas de citas escandalosamente divertidas o consejos de relación que les hagan pensar '¿Podemos hacer locuras como esta?' o '¡Esto somos totalmente nosotros!'. ¡Usa emojis apropiados (😏, 🔥, 🤣, 💡, etc.) adecuadamente para que todo el texto sea más vivo!",
      person1NameExample: "Apodo de la primera persona (ej: Espíritu libre impredecible)",
      person1ImpressionExample: "¡Oh jo~ Primera persona, está claro que no eres alguien común y corriente! 😏 Una vibra de espíritu libre emana de tus ojos y labios ligeramente levantados, ¿como si gritaras '¡Imposible no está en mi diccionario!'? Especialmente esa línea de la frente, aparentemente libre de ataduras, ¡realmente muestra un espíritu YOLO de 'Solo se vive una vez!'. Gracias a esto, siempre inspiras frescura a quienes te rodean, ¡pero a veces eres tan espontáneo/a que podrían decir que eres como una 'pelota saltarina impredecible'! 🤣",
      person2NameExample: "Apodo de la segunda persona (ej: Defensor estoico con un giro)",
      person2ImpressionExample: "¡La segunda persona parece un defensor estoico que emite un aura de 'mantente alejado', pero en realidad es una persona de afecto profundo con un giro sorprendente! 🧐 Ese puente nasal recto y boca firme muestran una voluntad de '¡Una vez que decido, lo cumplo!', ¡pero la mirada cálida que se muestra en momentos inesperados es el verdadero punto de encanto de esta persona! 🔥 Ser cauteloso/a es bueno, ¡pero a veces necesitas el coraje de bajar esa guardia y simplemente lanzarte!",
      compatibilityScoreReasonExample: "🎉 ¡Redoble de tambores, por favor! ¡La puntuación de compatibilidad de esta pareja es un rotundo 88! ¿Está esto evolucionando de una 'pareja desastrosa' a una 'pareja fantástica'?! 💕 Diferentes encantos se encuentran para crear una sinergia inesperada, ¡una combinación verdaderamente 'dulce y salada'! (¡Pero cuidado, podría ponerse demasiado salado o demasiado dulce y causar acidez estomacal! 😉)",
      goodPoint1Example: "Cuando el espíritu de '¡Simplemente hagámoslo!' de la primera persona se encuentra con la mentalidad de '¡Probemos este puente como si fuéramos a romperlo!' de la segunda persona? ¡Un resultado creativo sin precedentes, ZAS! ¡Incluso podría cambiar el mundo! 💡",
      goodPoint2Example: "Al respetar, e incluso sumergirse en, los 'fandoms' del otro, descubriréis un mundo completamente nuevo como, '¿Eh? ¿Me gustaba esto?' ¡y la profundidad de vuestra relación será extraordinaria! (Sin responsabilidad por los saldos de las cuentas bancarias 🤣)",
      improvementPoint1Example: "A veces, la primera persona podría adelantarse tanto que la segunda ni siquiera pueda gritar '¡Oye, espera!' o la segunda persona es tan cautelosa que la primera exclama: '¡Uf, qué frustrante! ¡Lo haré yo mismo!'. ¡Es urgente mejorar vuestras habilidades de 'control de ritmo'! 🚀",
      improvementPoint2Example: "Vuestras formas de expresión son tan diferentes, ¡que casi podríais filmar la temporada 2 de 'Los hombres son de Marte, las mujeres son de Venus'! 'Leerse la mente mutuamente' es genial, ¡pero a veces necesitáis equipar la habilidad de 'Tienes que decirlo en voz alta, ¿de acuerdo?' para ser felices juntos durante mucho, mucho tiempo sin malentendidos! 💬",
      overallSummaryExample: "Esta pareja, en una palabra, ¡es una 'Montaña Rusa Impredecible'! 🎢 Discutiendo sin parar pero incapaces de vivir el uno sin el otro, ¿una relación de amor-odio(?), tal vez? Pero una cosa es segura, ¡vuestras vidas se volverán mucho más coloridas y alegres gracias al otro! ¡Enviad los patrones de aburrimiento a Andrómeda y disfrutad de este emocionante viaje al máximo! 🔥",
      advice1Example: "¿Qué tal una 'Cita de Extravagancia de Disparates'? ¡Durante un día, simplemente lanzaos cualquier pensamiento aleatorio sin filtro! (¡Pero sin resentimientos después! 🤙) ¡Podríais descubrir una sinceridad inesperada o un humor desternillante!",
      advice2Example: "¡Organizad una 'Batalla de Pasados Vergonzosos'! ¡Compartid vuestras fotos o episodios antiguos más vergonzosos y competid para ver quién tiene la historia vergonzosa más potente! ¡Sin responsabilidad si lloráis de la risa hasta que se os caigan los mocos! 😂 ¡A través de este proceso, os enamoraréis aún más profundamente de los encantos humanos del otro!",
      languageInstructionSuffix: "Todas las descripciones deben escribirse en el idioma seleccionado (Español) en un tono muy amigable, divertido y humorístico, lleno de energía positiva."
    }
  },
};


const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

const App = () => {
  const [language, setLanguage] = useState('ko'); // 기본 언어 한국어
  const [currentStrings, setCurrentStrings] = useState(translations.ko);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);


  const [person1ImageFile, setPerson1ImageFile] = useState(null);
  const [person1ImagePreview, setPerson1ImagePreview] = useState(null);
  const [person2ImageFile, setPerson2ImageFile] = useState(null);
  const [person2ImagePreview, setPerson2ImagePreview] = useState(null);

  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [isAdWatched, setIsAdWatched] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isWatchingRewardedAd, setIsWatchingRewardedAd] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    setCurrentStrings(translations[language]);
    setPerson1ImagePreview(`https://placehold.co/400x400/e2e8f0/cbd5e0?text=${translations[language].placeholderImageText1}`);
    setPerson2ImagePreview(`https://placehold.co/400x400/e9d5ff/a855f7?text=${translations[language].placeholderImageText2}`);
    // 언어 변경 시 다른 상태들도 초기화 (선택적)
    setAnalysisResult(null);
    setError('');
    setShowInterstitialAd(false);
    setIsAdWatched(false);
    setShowResults(false);
    setIsWatchingRewardedAd(false);
    setCopyStatus('');
    setIsLoading(false);
    setPerson1ImageFile(null);
    setPerson2ImageFile(null);
  }, [language]);


  const selectLanguage = (langCode) => {
    setLanguage(langCode);
    setShowLanguageDropdown(false); // 드롭다운 닫기
  };

  const resetAllStates = () => {
    setPerson1ImageFile(null);
    setPerson1ImagePreview(`https://placehold.co/400x400/e2e8f0/cbd5e0?text=${currentStrings.placeholderImageText1}`);
    setPerson2ImageFile(null);
    setPerson2ImagePreview(`https://placehold.co/400x400/e9d5ff/a855f7?text=${currentStrings.placeholderImageText2}`);
    setAnalysisResult(null);
    setError('');
    setShowInterstitialAd(false);
    setIsAdWatched(false);
    setShowResults(false);
    setIsWatchingRewardedAd(false);
    setCopyStatus('');
    setIsLoading(false);
  };

  const handleImageChange = (event, person) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (person === 1) {
          setPerson1ImageFile(file);
          setPerson1ImagePreview(reader.result);
        } else {
          setPerson2ImageFile(file);
          setPerson2ImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
      setAnalysisResult(null);
      setError('');
      setShowInterstitialAd(false);
      setIsAdWatched(false);
      setShowResults(false);
      setIsWatchingRewardedAd(false);
      setCopyStatus('');
    }
  };

  const handleAnalysis = useCallback(async () => {
    if (!person1ImageFile || !person2ImageFile) {
      setError(currentStrings.errorMessageDefault);
      return;
    }

    setIsLoading(true); setShowInterstitialAd(true);
    setAnalysisResult(null); setError(''); setIsAdWatched(false);
    setShowResults(false); setIsWatchingRewardedAd(false); setCopyStatus('');

    try {
      const base64Image1 = await getBase64(person1ImageFile);
      const mimeType1 = person1ImageFile.type;
      const base64Image2 = await getBase64(person2ImageFile);
      const mimeType2 = person2ImageFile.type;

      const currentPromptStrings = currentStrings.aiPrompt;
      const langName = language === 'ko' ? '한국어' : language === 'en' ? 'English' : language === 'ja' ? '日本語' : language === 'zh' ? '中文' : 'Español';

      const prompt = `${currentPromptStrings.instruction}\n\n${currentPromptStrings.jsonFormatInstruction}\n{\n  "person1_analysis": {\n    "name": "${currentPromptStrings.person1NameExample}", \n    "overall_impression": "${currentPromptStrings.person1ImpressionExample}"\n  },\n  "person2_analysis": {\n    "name": "${currentPromptStrings.person2NameExample}",\n    "overall_impression": "${currentPromptStrings.person2ImpressionExample}"\n  },\n  "compatibility": {\n    "score": 88, \n    "score_reason": "${currentPromptStrings.compatibilityScoreReasonExample}",\n    "good_points": [\n      "${currentPromptStrings.goodPoint1Example}",\n      "${currentPromptStrings.goodPoint2Example}"\n    ],\n    "areas_for_improvement": [\n      "${currentPromptStrings.improvementPoint1Example}",\n      "${currentPromptStrings.improvementPoint2Example}"\n    ],\n    "overall_summary": "${currentPromptStrings.overallSummaryExample}",\n    "advice": [\n      "${currentPromptStrings.advice1Example}",\n      "${currentPromptStrings.advice2Example}"\n    ]\n  }\n}\n${currentPromptStrings.languageInstructionSuffix.replace(/\(([^)]+)\)/, `(${langName})`)}`;


      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType: mimeType1, data: base64Image1 } },
              { inlineData: { mimeType: mimeType2, data: base64Image2 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        }
      };

      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setIsLoading(false); setShowInterstitialAd(false);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`${currentStrings.apiErrorGeneric}: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
        const rawJson = result.candidates[0].content.parts[0].text;
        try {
          const parsedJson = JSON.parse(rawJson);
          setAnalysisResult(parsedJson);
        } catch (e) {
          console.error("JSON 파싱 오류:", e, "원본 텍스트:", rawJson);
          setError(currentStrings.apiErrorJsonParse);
          setAnalysisResult(null);
        }
      } else {
        console.error('API 응답 형식 오류:', result);
        const detailedError = result.promptFeedback?.blockReason?.toString() || currentStrings.apiErrorResponseFormat.split('😥')[1].split('잠시 후')[0].trim();
        setError(`${currentStrings.apiErrorResponseFormat.split('😥')[0]}😥 (${detailedError}) ${currentStrings.apiErrorResponseFormat.split('😥')[1].split('잠시 후')[1]}`);
      }
    } catch (err) {
      console.error('분석 중 오류 발생:', err);
      setError(`${currentStrings.apiErrorNetwork.split('😭')[0]}😭 (${err.message}) ${currentStrings.apiErrorNetwork.split('😭')[1].split('네트워크')[1]}`);
      setIsLoading(false); setShowInterstitialAd(false);
    }
  }, [person1ImageFile, person2ImageFile, currentStrings, language]);

  const handleWatchRewardedAd = () => {
    setIsWatchingRewardedAd(true);
    setTimeout(() => {
      setIsAdWatched(true);
      setShowResults(true);
      setIsWatchingRewardedAd(false);
    }, 3000);
  };

  const renderHearts = (score) => {
    const totalHearts = 5;
    const filledHearts = Math.round((score / 100) * totalHearts);
    return (
      <div className="flex">
        {[...Array(totalHearts)].map((_, i) => (
          <HeartIcon key={i} className={`w-8 h-8 ${i < filledHearts ? 'text-red-500' : 'text-gray-300'}`} filled={i < filledHearts} />
        ))}
      </div>
    );
  };

  const RegularAdPlaceholder = () => (
    <div className="my-6 p-3 bg-gray-100 rounded-lg text-center border border-gray-300">
      <p className="text-gray-600 text-xs">{currentStrings.adPlaceholderBannerText.split('+').join(' ') + " (찡긋 😉)"}</p>
      <img
        src={`https://placehold.co/300x100/e0e0e0/757575?text=${currentStrings.adPlaceholderBannerText}`}
        alt="Regular Ad Banner Example"
        className="mx-auto mt-1 rounded"
      />
    </div>
  );

  const InterstitialAdModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-white p-6 sm:p-10 rounded-lg shadow-2xl text-center max-w-md w-full">
        <h3 className="text-2xl font-bold text-purple-600 mb-4">{currentStrings.interstitialAdTitle}</h3>
        <p className="text-gray-700 mb-2">{currentStrings.interstitialAdBody1}</p>
        <p className="text-gray-500 text-sm mb-6">{currentStrings.interstitialAdBody2}</p>
        <img
          src={`https://placehold.co/320x250/dedede/777777?text=${currentStrings.adPlaceholderInterstitialText}`}
          alt="Interstitial Ad Example"
          className="mx-auto rounded-md shadow-md mb-6"
        />
        <div className="animate-pulse">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto animate-spin"></div>
          <p className="text-purple-600 mt-3 font-semibold">{currentStrings.interstitialAdLoadingText}</p>
        </div>
      </div>
    </div>
  );

  const RewardedAdModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
        <h3 className="text-xl font-semibold text-indigo-600 mb-3">{currentStrings.rewardedAdTitle}</h3>
        <p className="text-gray-600 mb-5">{currentStrings.rewardedAdBody}</p>
        <img
          src={`https://placehold.co/280x200/d1d5db/4b5563?text=${currentStrings.adPlaceholderRewardedText}`}
          alt="Rewarded Ad Example"
          className="mx-auto rounded mb-5 shadow"
        />
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div className="bg-indigo-600 h-2.5 rounded-full animate-pulse" style={{ width: "75%" }}></div>
        </div>
        <p className="text-sm text-gray-500">{currentStrings.rewardedAdFooter}</p>
      </div>
    </div>
  );

  const generateShareText = () => {
    if (!analysisResult || !analysisResult.compatibility) return `${currentStrings.appTitle}!`;
    const { score, overall_summary } = analysisResult.compatibility;
    let summaryPart = overall_summary ? overall_summary.split('.')[0] + '.' : "";
    if (summaryPart.length > 70) summaryPart = summaryPart.substring(0, 70) + "...";
    return `${currentStrings.appTitle} - ${currentStrings.compatibilityTitle} ${score}${currentStrings.scoreUnit.substring(0, 1)}! 💖 ${summaryPart}`;
  };

  const handleCopyToClipboard = () => {
    if (!analysisResult) return;
    const appUrl = window.location.href;
    const title = `💖 ${currentStrings.resultTitle} 💖\n\n`;
    const p1Name = analysisResult.person1_analysis?.name || currentStrings.person1Title;
    const p2Name = analysisResult.person2_analysis?.name || currentStrings.person2Title;
    const scoreText = `✨ ${currentStrings.compatibilityTitle} ${analysisResult.compatibility?.score || 'N/A'}${currentStrings.scoreUnit.substring(0, 1)} ✨\n(${analysisResult.compatibility?.score_reason || currentStrings.scoreDefaultReason})\n\n`;
    const p1Impression = `--- ${p1Name}${currentStrings.personAnalysisTitleSuffix} ---\n${analysisResult.person1_analysis?.overall_impression || ''}\n\n`;
    const p2Impression = `--- ${p2Name}${currentStrings.personAnalysisTitleSuffix} ---\n${analysisResult.person2_analysis?.overall_impression || ''}\n\n`;
    const compatibilitySummary = `--- ${currentStrings.overallCommentTitle} ---\n${analysisResult.compatibility?.overall_summary || currentStrings.defaultOverallComment}\n\n`;
    const goodPoints = `👍 ${currentStrings.goodPointsTitle}:\n${(analysisResult.compatibility?.good_points || []).map(p => `- ${p}`).join('\n')}\n\n`;
    const improvementPoints = `⚠️ ${currentStrings.improvementPointsTitle}:\n${(analysisResult.compatibility?.areas_for_improvement || []).map(p => `- ${p}`).join('\n')}\n\n`;
    const advice = `💡 ${currentStrings.adviceTitle}:\n${(analysisResult.compatibility?.advice || []).map(p => `- ${p}`).join('\n')}\n\n`;

    const textToCopy = `${title}${p1Impression}${p2Impression}${scoreText}${compatibilitySummary}${goodPoints}${improvementPoints}${advice}${currentStrings.appSubtitle.split('!')[0]} (App URL: ${appUrl})`;

    const textarea = document.createElement('textarea');
    textarea.value = textToCopy;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopyStatus(currentStrings.copySuccessMessage);
    } catch (err) {
      setCopyStatus(currentStrings.copyErrorMessage);
      console.error('클립보드 복사 실패:', err);
    }
    document.body.removeChild(textarea);
    setTimeout(() => setCopyStatus(''), 3000);
  };

  const appUrlForShare = "https://example.com/couple-compatibility-app";

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 p-4 sm:p-6 lg:p-8 flex flex-col items-center font-['Gaegu',_cursive] text-gray-700">
      {showInterstitialAd && <InterstitialAdModal />}
      {isWatchingRewardedAd && <RewardedAdModal />}

      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Gaegu:wght@300;400;700&display=swap');
          body { font-family: 'Gaegu', cursive; } 
          .cartoon-bubble { 
            position: relative;
            background: #f0f8ff; 
            border-radius: .4em;
            padding: 1em;
            border: 2px solid #6ca0dc; 
          }
          .cartoon-bubble:after { 
            content: '';
            position: absolute;
            bottom: 0;
            left: 20%;
            width: 0;
            height: 0;
            border: 20px solid transparent;
            border-top-color: #6ca0dc;
            border-bottom: 0;
            margin-left: -20px;
            margin-bottom: -20px;
          }
          .animate-shake { 
            animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
            transform: translate3d(0, 0, 0);
          }
          @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
          }
          .animate-pulse { 
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
          }
          .animate-bounce { 
            animation: bounce 1s infinite;
          }
          @keyframes bounce {
            0%, 100% {
              transform: translateY(-5%);
              animation-timing-function: cubic-bezier(0.8,0,1,1);
            }
            50% {
              transform: none;
              animation-timing-function: cubic-bezier(0,0,0.2,1);
            }
          }
        `}
      </style>

      {/* 언어 선택 드롭다운 */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
          className="flex items-center bg-white/30 text-white px-3 py-2 rounded-lg hover:bg-white/50 transition-colors duration-300"
        >
          <GlobeIcon className="w-5 h-5 mr-2" />
          {currentStrings.languageSelectLabel}
          <ChevronDownIcon className={`w-5 h-5 ml-1 transform transition-transform duration-200 ${showLanguageDropdown ? 'rotate-180' : ''}`} />
        </button>
        {showLanguageDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
            <button
              type="button"
              onClick={() => selectLanguage('ko')}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {translations.ko.languageKorean}
            </button>
            <button
              type="button"
              onClick={() => selectLanguage('en')}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {translations.en.languageEnglish}
            </button>
            <button
              type="button"
              onClick={() => selectLanguage('ja')}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {translations.ja.languageJapanese}
            </button>
            <button
              type="button"
              onClick={() => selectLanguage('zh')}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {translations.zh.languageChinese}
            </button>
            <button
              type="button"
              onClick={() => selectLanguage('es')}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {translations.es.languageSpanish}
            </button>

          </div>
        )}
      </div>


      <header className="w-full max-w-4xl mt-16 sm:mt-12 mb-8 text-center"> {/* 언어 선택기 공간 확보를 위해 mt 증가 */}
        <h1 className="text-5xl sm:text-6xl font-bold text-white py-2 flex items-center justify-center drop-shadow-lg">
          <UsersIcon className="inline-block w-12 h-12 mr-3 text-pink-300" />
          {currentStrings.appTitle}
          <HeartIcon className="inline-block w-12 h-12 ml-3 text-red-400 animate-pulse" filled={true} />
        </h1>
        <p className="text-xl text-white mt-3 drop-shadow-md">{currentStrings.appSubtitle}</p>
        <p className="text-sm text-white/80 mt-1 drop-shadow-sm">{currentStrings.appDisclaimer}</p>
      </header>

      <main className="w-full max-w-4xl bg-white/95 backdrop-blur-md shadow-2xl rounded-xl p-6 sm:p-8">
        {!showResults && (
          <>
            {/* 관상 설명 섹션 */}
            <section className="mb-8 p-4 bg-indigo-50 rounded-lg shadow">
              <h3 className="text-xl font-bold text-indigo-700 mb-2 text-center">{currentStrings.physiognomyIntroTitle}</h3>
              <p className="text-sm text-gray-600 leading-relaxed text-center">{currentStrings.physiognomyIntroText}</p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {[1, 2].map(personNum => (
                <div key={personNum} className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors flex flex-col items-center ${personNum === 1 ? 'border-rose-300 hover:border-rose-500' : 'border-fuchsia-300 hover:border-fuchsia-500'}`}>
                  <h2 className="text-2xl font-bold mb-3">{personNum === 1 ? currentStrings.person1Title : currentStrings.person2Title} 👑</h2>
                  <p className="text-sm text-gray-600 mb-3" dangerouslySetInnerHTML={{ __html: currentStrings.uploadInstruction }}></p>
                  <img
                    src={personNum === 1 ? person1ImagePreview : person2ImagePreview}
                    alt={`${personNum === 1 ? currentStrings.person1Title : currentStrings.person2Title} ${currentStrings.fileLoaded}`}
                    className="w-48 h-48 md:w-56 md:h-56 object-cover mx-auto rounded-full shadow-xl mb-4 border-4 border-white"
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/e2e8f0/cbd5e0?text=${currentStrings.placeholderImageError}`; }}
                  />
                  <label htmlFor={`person${personNum}ImageUpload`} className={`cursor-pointer inline-flex items-center justify-center px-6 py-3 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 mt-auto text-lg ${personNum === 1 ? 'bg-rose-500 hover:bg-rose-600' : 'bg-fuchsia-500 hover:bg-fuchsia-600'}`}>
                    <UploadCloudIcon className="w-6 h-6 mr-2" />
                    {currentStrings.uploadButton}
                  </label>
                  <input type="file" id={`person${personNum}ImageUpload`} accept="image/*" onChange={(e) => handleImageChange(e, personNum)} className="hidden" />
                  {(personNum === 1 ? person1ImageFile : person2ImageFile) && <p className="text-xs text-gray-500 mt-2">{(personNum === 1 ? person1ImageFile : person2ImageFile).name} {currentStrings.fileLoaded}</p>}
                </div>
              ))}
            </section>

            <RegularAdPlaceholder />

            <section className="mb-8 text-center">
              {!analysisResult && !isLoading && (
                <button
                  onClick={handleAnalysis}
                  disabled={!person1ImageFile || !person2ImageFile}
                  className="px-12 py-5 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-2xl rounded-lg shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                >
                  <HeartIcon className="inline-block w-8 h-8 mr-2 animate-ping" filled={true} />
                  {currentStrings.analyzeButton}
                </button>
              )}
              {isLoading && (
                <p className="text-xl text-purple-700 font-semibold animate-bounce">{currentStrings.loadingMessage}</p>
              )}
              {analysisResult && !isLoading && !isAdWatched && (
                <button
                  onClick={handleWatchRewardedAd}
                  className="px-10 py-5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold text-xl rounded-lg shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center mx-auto"
                >
                  <PlayCircleIcon className="w-7 h-7 mr-2" />
                  {currentStrings.watchAdButton}
                </button>
              )}
              {error && <p className="text-red-500 bg-red-100 border border-red-300 rounded-md p-4 text-md mt-4 max-w-md mx-auto shadow-md animate-shake">{error}</p>}
            </section>
          </>
        )}

        {showResults && analysisResult && (
          <section className="bg-white/80 p-6 rounded-xl shadow-xl mt-8 font-gowun text-lg">
            <h2 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 mb-8 animate-bounce">{currentStrings.resultTitle}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {[analysisResult.person1_analysis, analysisResult.person2_analysis].map((person, personIndex) => (
                <div key={personIndex} className={`p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300 ${personIndex === 0 ? 'bg-gradient-to-br from-rose-100 to-pink-200 border-rose-300' : 'bg-gradient-to-br from-fuchsia-100 to-purple-200 border-fuchsia-300'} border-2`}>
                  <h3 className={`text-3xl font-bold mb-4 text-center ${personIndex === 0 ? 'text-rose-600' : 'text-fuchsia-600'}`}>{(person?.name || (personIndex === 0 ? currentStrings.person1Title : currentStrings.person2Title))} {currentStrings.personAnalysisTitleSuffix}</h3>
                  <p className="text-md leading-relaxed whitespace-pre-line p-4 bg-white/70 rounded-lg shadow-inner cartoon-bubble">{person?.overall_impression || "..."}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-indigo-100 to-blue-200 p-6 rounded-xl shadow-xl border-2 border-indigo-300">
              <h3 className="text-3xl font-bold text-indigo-700 mb-6 text-center">{currentStrings.compatibilityTitle}</h3>
              <div className="flex justify-center mb-4">
                {renderHearts(analysisResult.compatibility?.score || 0)}
              </div>
              <p className="text-5xl font-bold text-indigo-600 mb-2 text-center animate-pulse">{analysisResult.compatibility?.score || 0}{currentStrings.scoreUnit}</p>
              <p className="text-md text-gray-700 mb-6 italic text-center p-2 bg-white/50 rounded-md">{analysisResult.compatibility?.score_reason || currentStrings.scoreDefaultReason}</p>

              <div className="text-left space-y-6">
                {analysisResult.compatibility?.good_points && analysisResult.compatibility.good_points.length > 0 && (
                  <div>
                    <h4 className="text-xl font-bold text-green-700 mb-2 flex items-center"><ThumbsUpIcon className="w-6 h-6 mr-2 text-green-500" /> {currentStrings.goodPointsTitle}</h4>
                    {analysisResult.compatibility.good_points.map((point, index) => (
                      <p key={index} className="text-md text-gray-800 mb-1 p-3 bg-green-100 rounded-lg shadow-sm">- {point}</p>
                    ))}
                  </div>
                )}
                {analysisResult.compatibility?.areas_for_improvement && analysisResult.compatibility.areas_for_improvement.length > 0 && (
                  <div>
                    <h4 className="text-xl font-bold text-red-700 mb-2 flex items-center"><ThumbsDownIcon className="w-6 h-6 mr-2 text-red-500" /> {currentStrings.improvementPointsTitle}</h4>
                    {analysisResult.compatibility.areas_for_improvement.map((area, index) => (
                      <p key={index} className="text-md text-gray-800 mb-1 p-3 bg-red-100 rounded-lg shadow-sm">- {area}</p>
                    ))}
                  </div>
                )}
              </div>

              <h4 className="text-2xl font-bold text-indigo-700 mt-8 mb-3 text-center">{currentStrings.overallCommentTitle}</h4>
              <p className="text-md text-gray-800 leading-relaxed whitespace-pre-line p-4 bg-white/70 rounded-lg shadow-inner cartoon-bubble mb-8">{analysisResult.compatibility?.overall_summary || currentStrings.defaultOverallComment}</p>

              <h4 className="text-2xl font-bold text-indigo-700 mt-8 mb-3 text-center">{currentStrings.adviceTitle}</h4>
              {analysisResult.compatibility?.advice?.map((adv, index) => (
                <p key={index} className="text-md text-gray-800 mb-2 p-3 bg-indigo-100 rounded-lg shadow-sm">- {adv}</p>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-gray-300 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleCopyToClipboard}
                className="w-full sm:w-auto flex items-center justify-center px-5 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-lg transition-colors text-md"
              >
                <CopyIcon className="w-5 h-5 mr-2" /> {currentStrings.copyButton}
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(generateShareText())}&url=${encodeURIComponent(appUrlForShare)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center px-5 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg shadow-lg transition-colors text-md"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                {currentStrings.shareTwitterButton}
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrlForShare)}&quote=${encodeURIComponent(generateShareText())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-colors text-md"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12Z" clipRule="evenodd"></path></svg>
                {currentStrings.shareFacebookButton}
              </a>
              <button
                onClick={resetAllStates}
                className="w-full sm:w-auto flex items-center justify-center px-5 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-lg transition-colors text-md"
              >
                <RefreshCwIcon className="w-5 h-5 mr-2" />
                {currentStrings.retryButton}
              </button>
            </div>
            {copyStatus && <p className="text-center text-md text-green-700 mt-4 font-semibold animate-bounce">{copyStatus}</p>}
          </section>
        )}
      </main>

      <footer className="w-full max-w-4xl mt-12 text-center">
        <p className="text-md text-white/90 drop-shadow-sm">
          {currentStrings.footerText.replace('{year}', new Date().getFullYear())}
        </p>
      </footer>
    </div>
  );
};

export default App;
