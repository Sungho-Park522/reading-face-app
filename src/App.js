import React, { useState, useCallback, useEffect, useRef } from 'react';
// Firebase SDK import
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getStorage, ref, uploadBytes, getDownloadURL
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
const isFirebaseConfigured = Object.values(firebaseConfig).every(v => v);

if (isFirebaseConfigured) {
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
  console.warn("Firebase configuration is missing or invalid. Database features will be disabled.");
}


// 아이콘 정의
const UploadCloudIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path></svg>);
const UserIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const LinkIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>);
const RefreshCwIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>);
const CalendarIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>);
const SendIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>);

// 다국어 텍스트 및 프롬프트
const translations = {
  ko: {
    // ... (기존 텍스트 생략)
    analyzePrompt: `당신은 '운이'라는 이름을 가진, 인간의 운명을 꿰뚫어 보는 AI 예언가입니다. 사용자의 사진(관상)과 생년월일(사주)을 바탕으로, 앞으로 펼쳐질 대화의 기반이 될 '운명 진단서'를 생성해야 합니다.

**[기본 정보]**
- 사용자의 생년월일: {birthdate}

**[생성 목표]**
1.  **fullNarrative**: 사용자가 겪게 될 운명의 서사를 한 편의 긴 이야기로 생성합니다. 이 이야기는 여러 문단으로 구성되어야 하며, 각 문단은 \`\\n\\n\`으로 구분됩니다. 내용은 정곡을 찌르는 도입, 과거 회상, 본질 분석, 미래 시나리오, 생존 지침, 마지막 조언의 흐름을 따라야 합니다.
2.  **shortSummary**: 위 fullNarrative의 핵심 내용을 3~4문장으로 요약합니다. 이 요약본은 이후 사용자와의 Q&A에서 AI가 사용자의 맥락을 기억하는 데 사용됩니다.

**[JSON 응답 형식]**
반드시 아래의 JSON 구조를 완벽하게 준수하여 응답해야 합니다.
{
  "fullNarrative": "흠… 니 얼굴 참 묘하네.\\n\\n밖에서는 웃고 다니는 얼굴인데, 속은 늘 계산하고 있지. 손해는 절대 안 보려고 하고...\\n\\n(중략...)\\n\\n이번엔 무시하지 마라.",
  "shortSummary": "겉으론 웃지만 속으론 계산적인 성격. 과거에 사람에게 크게 마음을 열었다가 상처받은 경험이 있으며, 이로 인해 인간관계에 신중하다. 2025년 가을, 과거와 유사한 중요한 기회가 찾아오지만, 감정적인 결정보다는 이성적인 판단이 필요하다."
}`,
    askPrompt: `당신은 '운이'라는 AI 예언가입니다. 당신은 이미 사용자에 대한 1차 진단을 마친 상태이며, 이제부터는 사용자의 추가 질문에 답변해야 합니다.

**[사용자 정보 요약]**
{shortSummary}

**[사용자의 추가 질문]**
{question}

**[답변 지침]**
- 위 '사용자 정보 요약'을 바탕으로, 사용자의 성향과 상황에 맞는 답변을 생성하세요.
- 당신의 페르소나(날카롭고 직설적인 반말)를 유지하며, 한두 문단의 짧고 핵심적인 답변을 제공하세요.
- 질문에 대한 직접적인 답변과 함께, 사용자가 스스로를 돌아볼 수 있는 통찰을 담아주세요.

**[JSON 응답 형식]**
반드시 아래의 JSON 구조를 완벽하게 준수하여 응답해야 합니다.
{
  "answer": "그 사람? 다시 만나봐야 너만 힘들어져. 니가 약해져 있을 때만 찾아오는 인연은, 독이라는 걸 아직도 모르겠냐? 정신 차려."
}`,
  }
};

// Helper Functions
const getBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = (error) => reject(error);
});

// --- 각 Scene 컴포넌트 ---

const IntroPage = ({ onNext }) => (
    <div className="w-full h-screen flex flex-col items-center justify-center text-center text-white p-8 bg-gray-900">
        <h1 className="text-5xl font-bold font-gaegu mb-4">AI 운명 비기</h1>
        <p className="text-xl text-gray-300 mb-8 font-gowun">안녕하세요, 사주와 관상을 보려면 사진과 생년월일이 필요합니다.</p>
        <button onClick={onNext} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold transition-colors">
            다음으로
        </button>
    </div>
);

const InfoInputPage = ({ onNext, setUserPhoto, setBirthdate }) => {
    // ... (기존 InputSection, UserInfoSection 로직을 여기에 통합하거나 import)
    // 이 예제에서는 단순화된 형태로 구현합니다.
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(`https://placehold.co/400x400/e2e8f0/cbd5e0?text=사진+업로드`);
    const [dob, setDob] = useState('');

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleNextClick = () => {
        if (photoFile && dob) {
            setUserPhoto(photoFile);
            setBirthdate(dob);
            onNext();
        } else {
            alert("사진과 생년월일을 모두 입력해주세요.");
        }
    };

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center p-8 bg-gray-900 text-white">
            <h2 className="text-3xl font-bold font-gaegu mb-8">그대의 정보를 알려주게.</h2>
            <div className="flex flex-col items-center gap-8">
                <label htmlFor="photo-upload" className="cursor-pointer">
                    <img src={photoPreview} alt="Upload preview" className="w-48 h-48 rounded-full object-cover border-4 border-gray-600 hover:border-indigo-500 transition-colors" />
                </label>
                <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                <input
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="생년월일 (YYYY-MM-DD)"
                    className="w-64 p-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-center focus:outline-none focus:border-indigo-500"
                />
                <button onClick={handleNextClick} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold transition-colors">
                    다음
                </button>
            </div>
        </div>
    );
};

const ChamberEntranceScene = ({ onNext }) => {
    useEffect(() => {
        // 3초 후 다음 장면으로 자동 전환
        const timer = setTimeout(onNext, 3000);
        return () => clearTimeout(timer);
    }, [onNext]);

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden">
            <div className="animate-fadeIn space-y-4 text-center">
                <p className="text-2xl font-gowun">점집으로 들어서는 중...</p>
                <p className="text-3xl font-gaegu animate-pulse">“앉게나… 오늘 너를 보기 위해 별을 많이 들여다봤지.”</p>
            </div>
        </div>
    );
};

const FortuneAnalysisScene = ({ fullNarrative, onNext }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const paragraphs = fullNarrative.split('\n\n');

    const handleNextParagraph = () => {
        if (currentIndex < paragraphs.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onNext();
        }
    };

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8" onClick={handleNextParagraph}>
            <div className="w-full max-w-3xl text-center space-y-8">
                <p className="text-2xl font-gowun leading-relaxed whitespace-pre-wrap">
                    {paragraphs[currentIndex]}
                </p>
                {currentIndex === paragraphs.length - 1 ? (
                    <button onClick={onNext} className="mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold transition-colors animate-pulse">
                        그래… 또 궁금한 게 있느냐?
                    </button>
                ) : (
                     <p className="text-sm text-gray-500 mt-8 animate-pulse">화면을 터치하여 다음 내용 보기</p>
                )}
            </div>
        </div>
    );
};

const QnAInteractionScene = ({ shortSummary, onNext }) => {
    const [qnaLog, setQnaLog] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showAd, setShowAd] = useState(false);
    const [pendingQuestion, setPendingQuestion] = useState('');

    const handleSendQuestion = async (question) => {
        setQnaLog(prev => [...prev, { sender: 'user', text: question }]);
        setPendingQuestion(question);
        setShowAd(true); // 광고 먼저 표시
    };
    
    const handleAdClose = async () => {
        setShowAd(false);
        setIsTyping(true);

        try {
            // 여기에 /api/ask 호출 로직 구현
            const prompt = translations.ko.askPrompt
                .replace("{shortSummary}", shortSummary)
                .replace("{question}", pendingQuestion);
            
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error("API 호출 실패");
            const result = await response.json();
            const parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);

            setQnaLog(prev => [...prev, { sender: 'ai', text: parsedJson.answer }]);
        } catch (err) {
            setQnaLog(prev => [...prev, { sender: 'ai', text: "미안하구나, 지금은 답을 찾기가 어렵다." }]);
        } finally {
            setIsTyping(false);
            setPendingQuestion('');
        }
    };

    return (
        <div className="relative w-full h-screen flex flex-col bg-gray-900 text-white">
            {/* ... (채팅 UI 구성, ResultPageComponent와 유사) ... */}
            <div className="flex-grow p-4 overflow-y-auto">
                {qnaLog.map((item, index) => (
                    <div key={index} className={`chat ${item.sender === 'user' ? 'chat-end' : 'chat-start'}`}>
                        <div className="chat-bubble">{item.text}</div>
                    </div>
                ))}
                {isTyping && <div className="chat chat-start"><div className="chat-bubble">...</div></div>}
            </div>
            <div className="p-4 flex gap-2">
                <input 
                    type="text" 
                    value={userInput} 
                    onChange={e => setUserInput(e.target.value)}
                    placeholder="더 궁금한 것을 물어보게..."
                    className="flex-grow p-3 bg-gray-800 rounded-lg focus:outline-none"
                />
                <button onClick={() => handleSendQuestion(userInput)} className="px-4 py-2 bg-indigo-600 rounded-lg">전송</button>
                <button onClick={onNext} className="px-4 py-2 bg-gray-600 rounded-lg">그만 묻기</button>
            </div>

            {/* 광고 모달 */}
            {showAd && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
                    <p className="text-xl mb-4">복비를 내고 운명을 들여다보게나...</p>
                    <div className="w-72 h-48 bg-gray-500 flex items-center justify-center mb-4">(광고 영역)</div>
                    <button onClick={handleAdClose} className="px-6 py-2 bg-indigo-600 rounded-lg">광고 닫기</button>
                </div>
            )}
        </div>
    );
};

const SummaryPage = ({ finalSummary, onReset }) => (
    <div className="w-full h-screen flex flex-col items-center justify-center text-center text-white p-8 bg-gray-900">
        <h2 className="text-3xl font-bold font-gaegu mb-8">좋다… 내가 지금까지 본 것을 정리해보마.</h2>
        <div className="w-full max-w-2xl p-6 bg-gray-800 rounded-lg mb-8">
            <p className="whitespace-pre-wrap font-gowun">{finalSummary || "운명의 실타래는 복잡하지만, 그대의 길은 명확해질 것이다."}</p>
        </div>
        <div className="flex gap-4">
            <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold transition-colors">점집 공유하기</button>
            <button className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-colors">점집 후원하기</button>
            <button onClick={onReset} className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-bold transition-colors">다시 보기</button>
        </div>
    </div>
);


// --- Main App Component ---
function App() {
    const [scene, setScene] = useState('intro'); // intro, input, entrance, analysis, qna, summary
    
    // 상태 변수
    const [userPhoto, setUserPhoto] = useState(null);
    const [birthdate, setBirthdate] = useState('');
    const [shortSummary, setShortSummary] = useState('');
    const [fullNarrative, setFullNarrative] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError('');
        try {
            const prompt = translations.ko.analyzePrompt.replace("{birthdate}", birthdate);
            const imageBase64 = await getBase64(userPhoto);
            const parts = [{ text: prompt }, { inlineData: { mimeType: userPhoto.type, data: imageBase64 } }];

            const payload = { contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json" } };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error("API 호출 실패");
            const result = await response.json();
            const parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);

            setFullNarrative(parsedJson.fullNarrative);
            setShortSummary(parsedJson.shortSummary);
            setScene('entrance');
        } catch (err) {
            setError("분석 중 오류가 발생했습니다.");
            setScene('input'); // 오류 발생 시 입력 화면으로 복귀
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setUserPhoto(null);
        setBirthdate('');
        setShortSummary('');
        setFullNarrative('');
        setError('');
        setScene('intro');
    };

    const renderScene = () => {
        switch (scene) {
            case 'intro':
                return <IntroPage onNext={() => setScene('input')} />;
            case 'input':
                return <InfoInputPage 
                            setUserPhoto={setUserPhoto} 
                            setBirthdate={setBirthdate} 
                            onNext={handleAnalyze} 
                        />;
            case 'entrance':
                return <ChamberEntranceScene onNext={() => setScene('analysis')} />;
            case 'analysis':
                return <FortuneAnalysisScene fullNarrative={fullNarrative} onNext={() => setScene('qna')} />;
            case 'qna':
                return <QnAInteractionScene shortSummary={shortSummary} onNext={() => setScene('summary')} />;
            case 'summary':
                // For simplicity, using shortSummary as finalSummary. A dedicated API call could be made here.
                return <SummaryPage finalSummary={shortSummary} onReset={handleReset} />;
            default:
                return <IntroPage onNext={() => setScene('input')} />;
        }
    };

    return (
        <div className="bg-black">
            {isLoading && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <p className="text-white text-xl">운명을 읽는 중...</p>
                </div>
            )}
            {error && (
                 <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg z-50">
                    <p>{error}</p>
                 </div>
            )}
            {renderScene()}
        </div>
    );
}

export default App;
