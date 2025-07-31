import React, { useState, useEffect, useRef } from 'react';
// 'tone' 라이브러리는 동적으로 로드됩니다.

// --- 아이콘 컴포넌트들 ---
const UploadCloudIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path></svg>);
const CalendarIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>);
const Volume2Icon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>);
const VolumeXIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>);

// --- BGM 플레이어 ---
const BGMPlayer = () => {
    const [isMuted, setIsMuted] = useState(false);
    const [isToneLoaded, setIsToneLoaded] = useState(false);
    const synth = useRef(null);
    const loop = useRef(null);

    useEffect(() => {
        if (window.Tone) { setIsToneLoaded(true); return; }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js';
        script.async = true;
        script.onload = () => setIsToneLoaded(true);
        script.onerror = () => console.error("Failed to load Tone.js from CDN.");
        document.body.appendChild(script);
        return () => { if (document.body.contains(script)) { document.body.removeChild(script); }};
    }, []);

    useEffect(() => {
        if (isToneLoaded) {
            const Tone = window.Tone;
            synth.current = new Tone.AMSynth({ harmonicity: 1.5, envelope: { attack: 0.1, decay: 0.2, sustain: 0.1, release: 1.2 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: 0.5, decay: 0.01 } }).toDestination();
            loop.current = new Tone.Loop(time => {
                const notes = ['C2', 'E2', 'G2', 'A2'];
                const randomNote = notes[Math.floor(Math.random() * notes.length)];
                if(synth.current) synth.current.triggerAttackRelease(randomNote, '2n', time);
            }, '2m').start(0);
            Tone.Transport.start();
            return () => {
                if (Tone.Transport.state === 'started') Tone.Transport.stop();
                if (loop.current) loop.current.dispose();
                if (synth.current) synth.current.dispose();
            };
        }
    }, [isToneLoaded]);

    const toggleMute = () => {
        if (!isToneLoaded) return;
        const Tone = window.Tone;
        Tone.start().then(() => {
            if (Tone.getDestination()) { Tone.getDestination().mute = !isMuted; }
            setIsMuted(!isMuted);
        });
    };

    return (
        <button onClick={toggleMute} className="fixed top-4 right-4 text-white z-50 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors">
            {isMuted ? <VolumeXIcon className="w-6 h-6" /> : <Volume2Icon className="w-6 h-6" />}
        </button>
    );
};


// --- 제자 시퀀스 설정 ---
const apprenticeSequence = [
  { image: '/apprentice-standing.png', dialogue: [ { type: 'bold', text: '어서 오세요!' }, { type: 'bold', text: '저는 스승님의 제자 초희입니다.' }, ] },
  { image: '/apprentice-greeting.png', dialogue: [ { type: 'bold', text: '먼 길 오시느라 고생 많으셨습니다.' } ] },
  { image: '/apprentice-guiding.png', dialogue: [ { type: 'bold', text: '이 두루마리에' }, { type: 'bold', text: '스승님께 보여드릴 사진 한 장과' }, { type: 'bold', text: '생년월일을 기록해주시겠습니까?' } ] },
];


// --- 메인 앱 컴포넌트 ---
function App() {
    const [userPhoto, setUserPhoto] = useState(null);
    const [birthdate, setBirthdate] = useState('');
    const [photoPreview, setPhotoPreview] = useState(null);
    const [animationState, setAnimationState] = useState({
        showTitle: false,
        showApprentice: false,
        showScroll: false, // [MODIFIED] 쪽지(Note) 대신 두루마리(Scroll)를 제어
    });
    
    const [isReady, setIsReady] = useState(false);
    const [sequenceStep, setSequenceStep] = useState(0);
    const [displayedDialogues, setDisplayedDialogues] = useState([]);

    // 1. 이미지 프리로딩
    useEffect(() => {
        let isMounted = true;
        // [MODIFIED] 필요한 이미지만 프리로딩하도록 수정
        const imagePaths = [
            ...apprenticeSequence.map(s => s.image),
            '/scroll-unfurled.png' // 두루마리 배경 이미지
        ];
        const preloadImages = (paths) => Promise.all(paths.map(path => new Promise((resolve) => {
            const img = new Image();
            img.src = path;
            img.onload = resolve;
            img.onerror = () => { console.error(`Failed to load image: ${path}`); resolve(); };
        })));
        const minTimePromise = new Promise(resolve => setTimeout(resolve, 3000));
        Promise.all([preloadImages(imagePaths), minTimePromise]).then(() => {
            if (isMounted) setIsReady(true);
        });
        return () => { isMounted = false; };
    }, []);

    // 2. 기본 애니메이션 순서
    useEffect(() => {
        const timers = [
            setTimeout(() => setAnimationState(s => ({ ...s, showTitle: true })), 500),
            setTimeout(() => setAnimationState(s => ({ ...s, showApprentice: true })), 2000),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    // 3. 제자 장면 전환
    useEffect(() => {
        if (!isReady) return;
        setSequenceStep(0);
        const timer1 = setTimeout(() => setSequenceStep(1), 5000);
        const timer2 = setTimeout(() => {
            setSequenceStep(2);
            // [MODIFIED] 마지막 대사 후 두루마리가 나타나도록 설정
            setAnimationState(s => ({...s, showScroll: true}));
        }, 10000);
        return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }, [isReady]);

    // 4. 대사 애니메이션
    useEffect(() => {
        if (!isReady) return;
        const currentScene = apprenticeSequence[sequenceStep];
        if (!currentScene || currentScene.dialogue.length === 0) {
            setDisplayedDialogues([]);
            return;
        }
        setDisplayedDialogues([currentScene.dialogue[0]]);
        const remainingDialogues = currentScene.dialogue.slice(1);
        let dialogueTimer = 0;
        remainingDialogues.forEach((dialogue) => {
            dialogueTimer += 800;
            setTimeout(() => setDisplayedDialogues(prev => [...prev, dialogue]), dialogueTimer);
        });
    }, [sequenceStep, isReady]);

    // 5. 폼 관련 함수
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) { setUserPhoto(file); setPhotoPreview(URL.createObjectURL(file)); }
    };
    const handleSubmit = () => {
        if (!userPhoto || !birthdate) { alert("사진과 생년월일을 모두 입력해주십시오."); return; }
        console.log("Submitted Data:", { userPhoto, birthdate });
        alert("정보가 접수되었습니다. 다음 단계로 진행합니다.");
    };

    return (
        <div className="w-full h-screen bg-gray-900 overflow-hidden relative font-gowun">
            <style>{`
                @keyframes pop-in { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
                .dialogue-line { animation: pop-in 0.3s ease-out forwards; }
                @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
                .apprentice-image-fade-in { animation: fade-in 0.7s ease-in-out forwards; }
            `}</style>
            <BGMPlayer />
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/50 to-black z-0"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 z-0" />

            <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white transition-opacity duration-1000 ${animationState.showTitle ? 'opacity-100' : 'opacity-0'}`}>
                <h1 className="text-5xl md:text-6xl font-black font-gaegu mb-4 text-shadow-lg">AI 운명 비기</h1>
                <p className="text-xl md:text-2xl text-indigo-200 text-shadow">운명의 실타래를 풀어, 그대의 길을 밝혀드립니다.</p>
            </div>

            <div className={`absolute bottom-0 right-0 transition-transform duration-1000 ease-out ${animationState.showApprentice ? 'translate-x-0' : 'translate-x-full'}`}>
                {isReady ? ( <img key={apprenticeSequence[sequenceStep].image} src={apprenticeSequence[sequenceStep].image} alt="점쟁이 제자" className="w-[250px] h-[400px] object-contain drop-shadow-2xl apprentice-image-fade-in" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/250x400/000000/FFFFFF?text=이미지오류'; }} /> ) : ( <div className="w-[250px] h-[400px]"></div> )}
                {!isReady ? ( <div className="absolute top-20 -left-56 w-56 p-4 bg-white text-gray-800 rounded-xl shadow-2xl animate-[pop-in_0.5s_ease-out_forwards]"><p className="font-bold text-lg">잠시만요 나가고 있어요!</p><div className="absolute top-1/2 -translate-y-1/2 right-0 w-0 h-0 border-y-[10px] border-y-transparent border-l-[10px] border-l-white"></div></div> ) : ( <div className="absolute top-20 -left-56 w-56 p-4 bg-white text-gray-800 rounded-xl shadow-2xl animate-[pop-in_0.5s_ease-out_forwards]">{displayedDialogues.map((dialogue, index) => ( <p key={index} className={`dialogue-line ${dialogue.type === 'bold' ? 'font-bold text-lg' : ''}`}>{dialogue.text}</p> ))}<div className="absolute top-1/2 -translate-y-1/2 right-0 w-0 h-0 border-y-[10px] border-y-transparent border-l-[10px] border-l-white"></div></div> )}
            </div>

            {/* ==========================================================
                [MODIFIED] 새로운 두루마리 UI 영역
               ========================================================== */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md h-[70vh] max-h-[700px] z-20 transition-opacity duration-700 ease-in-out ${animationState.showScroll ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {/* 배경 두루마리 이미지 */}
                <div
                    className="absolute inset-0 bg-contain bg-no-repeat bg-center"
                    style={{ backgroundImage: `url('/scroll-unfurled.png')` }}
                ></div>
                
                {/* 입력 요소들을 담는 컨테이너 */}
                <div className="relative w-full h-full flex flex-col items-center justify-start pt-[25%]">
                    {/* 사진 업로드 */}
                    <div className="flex flex-col items-center mb-8">
                        <label htmlFor="photo-upload-form" className="cursor-pointer">
                            <div className="w-28 h-28 rounded-full bg-black/5 flex items-center justify-center border-2 border-dashed border-yellow-800/50 hover:bg-black/10 transition-colors">
                                {photoPreview ?
                                    <img src={photoPreview} alt="Preview" className="w-full h-full rounded-full object-cover" /> :
                                    <UploadCloudIcon className="w-8 h-8 text-yellow-800/70" />
                                }
                            </div>
                        </label>
                        <input id="photo-upload-form" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </div>

                    {/* 생년월일 입력 */}
                    <div className="relative w-[70%] max-w-xs mb-12">
                        <input
                            type="text"
                            value={birthdate}
                            onChange={(e) => setBirthdate(e.target.value)}
                            placeholder="생년월일 (YYYY-MM-DD)"
                            className="w-full p-2 text-center text-lg text-[#4a3f35] placeholder:text-yellow-800/50 bg-transparent border-b-2 border-yellow-800/60 focus:outline-none focus:border-yellow-800"
                        />
                    </div>

                    {/* 제출 버튼 */}
                    <button onClick={handleSubmit} className="px-12 py-3 bg-[#8c2c2c] text-white text-xl font-bold rounded-md shadow-lg hover:bg-[#a13a3a] transition-all transform hover:scale-105">
                        운명 기록하기
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;