import React, { useState, useEffect, useRef } from 'react';
// 'tone' 라이브러리는 동적으로 로드합니다.

// --- 아이콘 컴포넌트 ---
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
        if (window.Tone) {
            setIsToneLoaded(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js';
        script.async = true;
        script.onload = () => setIsToneLoaded(true);
        script.onerror = () => console.error("Failed to load Tone.js from CDN.");
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    useEffect(() => {
        if (isToneLoaded) {
            const Tone = window.Tone;
            
            synth.current = new Tone.AMSynth({
                harmonicity: 1.5,
                envelope: { attack: 0.1, decay: 0.2, sustain: 0.1, release: 1.2 },
                modulation: { type: 'sine' },
                modulationEnvelope: { attack: 0.5, decay: 0.01 }
            }).toDestination();
            
            loop.current = new Tone.Loop(time => {
                const notes = ['C2', 'E2', 'G2', 'A2'];
                const randomNote = notes[Math.floor(Math.random() * notes.length)];
                if(synth.current) synth.current.triggerAttackRelease(randomNote, '2n', time);
            }, '2m').start(0);

            Tone.Transport.start();

            return () => {
                if (Tone.Transport.state === 'started') {
                    Tone.Transport.stop();
                }
                if (loop.current) loop.current.dispose();
                if (synth.current) synth.current.dispose();
            };
        }
    }, [isToneLoaded]);

    const toggleMute = () => {
        if (!isToneLoaded) return;
        const Tone = window.Tone;
        Tone.start().then(() => {
            if (Tone.getDestination()) {
                Tone.getDestination().mute = !isMuted;
            }
            setIsMuted(!isMuted);
        });
    };

    return (
        <button onClick={toggleMute} className="fixed top-4 right-4 text-white z-50 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors">
            {isMuted ? <VolumeXIcon className="w-6 h-6" /> : <Volume2Icon className="w-6 h-6" />}
        </button>
    );
};


// --- 메인 앱 컴포넌트 ---
function App() {
    const [userPhoto, setUserPhoto] = useState(null);
    const [birthdate, setBirthdate] = useState('');

    // 인트로 애니메이션 상태 관리
    const [animationState, setAnimationState] = useState({
        showTitle: false,
        showApprentice: false,
        showBubble: false,
        showNote: false, // 쪽지 보이기
        expandNote: false, // 쪽지 펼치기 (입력폼으로 전환)
        showFormContent: false, // 폼 내용 보이기
    });

    useEffect(() => {
        // 애니메이션 순차 실행
        const timers = [
            setTimeout(() => setAnimationState(s => ({ ...s, showTitle: true })), 500),
            setTimeout(() => setAnimationState(s => ({ ...s, showApprentice: true })), 2000),
            setTimeout(() => setAnimationState(s => ({ ...s, showBubble: true })), 3500),
            setTimeout(() => setAnimationState(s => ({ ...s, showNote: true })), 5000),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    const handleNoteClick = () => {
        setAnimationState(s => ({ ...s, expandNote: true }));
        setTimeout(() => setAnimationState(s => ({ ...s, showFormContent: true })), 500); // 폼 확장 후 내용 표시
    };

    // 정보 입력 관련 핸들러
    const [photoPreview, setPhotoPreview] = useState(null);
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUserPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };
    
    const handleSubmit = () => {
        if (!userPhoto || !birthdate) {
            alert("사진과 생년월일을 모두 입력해주십시오.");
            return;
        }
        console.log("Submitted Data:", { userPhoto, birthdate });
        alert("정보가 접수되었습니다. 다음 단계로 진행합니다.");
    };

    return (
        <div className="w-full h-screen bg-gray-900 overflow-hidden relative font-gowun">
            <BGMPlayer />
            {/* 배경 효과 */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/50 to-black z-0"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 z-0" />

            {/* 1. 페이드인 텍스트 */}
            <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white transition-opacity duration-1000 ${animationState.showTitle ? 'opacity-100' : 'opacity-0'}`}>
                <h1 className="text-5xl md:text-6xl font-black font-gaegu mb-4 text-shadow-lg">AI 운명 비기</h1>
                <p className="text-xl md:text-2xl text-indigo-200 text-shadow">운명의 실타래를 풀어, 그대의 길을 밝혀드립니다.</p>
            </div>

            {/* 2. 제자 캐릭터 (PNG 이미지로 교체) */}
            <div className={`absolute bottom-0 right-0 transition-transform duration-1000 ease-out ${animationState.showApprentice ? 'translate-x-0' : 'translate-x-full'}`}>
                <img 
                    src="https://placehold.co/250x400/000000/FFFFFF?text=제자+캐릭터" 
                    alt="점쟁이 제자" 
                    className="w-[250px] h-[400px] object-contain drop-shadow-2xl"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/250x400/png?text=Image+Error'; }}
                />

                {/* 말풍선 */}
                <div className={`absolute top-20 -left-48 w-56 p-4 bg-white text-gray-800 rounded-xl shadow-2xl transition-all duration-500 origin-bottom-right ${animationState.showBubble ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                    <p className="font-bold text-lg">어서 오십시오.</p>
                    <p>스승님께 보여드릴 사진 한 장과 생년월일을 적어주시겠습니까?</p>
                    <div className="absolute bottom-0 right-[-10px] w-0 h-0 border-t-[15px] border-t-transparent border-l-[15px] border-l-white"></div>
                </div>
            </div>
            
            {/* 3. 쪽지 및 입력 폼 애니메이션 */}
            <div 
                className={`absolute transition-all duration-700 ease-in-out
                ${animationState.expandNote 
                    ? 'bottom-1/2 translate-y-1/2 left-1/2 -translate-x-1/2 w-[90vw] max-w-md h-auto' 
                    : 'bottom-1/2 left-1/2 -translate-x-1/2' // 초기 위치 (숨김)
                }`}
            >
                {/* 쪽지를 클릭하면 expandNote가 true가 되어 아래 폼이 나타남 */}
                <div className={`w-full h-full bg-[#fdf6e3] rounded-lg shadow-2xl border-4 border-[#eaddc7] p-8 flex flex-col items-center justify-center transition-opacity duration-300 ${animationState.expandNote ? 'opacity-100' : 'opacity-0'}`}>
                    <div className={`w-full transition-opacity duration-500 ${animationState.showFormContent ? 'opacity-100' : 'opacity-0'}`}>
                        <h3 className="text-2xl font-bold font-gaegu mb-6 text-center text-gray-800">운명의 기록</h3>
                        <div className="space-y-6 w-full">
                            {/* 사진 업로드 */}
                            <div className="flex flex-col items-center">
                                <label htmlFor="photo-upload-form" className="cursor-pointer">
                                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-400 hover:bg-gray-300 transition-colors">
                                        {photoPreview ? 
                                            <img src={photoPreview} alt="Preview" className="w-full h-full rounded-full object-cover" /> :
                                            <UploadCloudIcon className="w-8 h-8 text-gray-500" />
                                        }
                                    </div>
                                </label>
                                <input id="photo-upload-form" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                <p className="text-sm text-gray-600 mt-2">사진을 올려주십시오.</p>
                            </div>
                            {/* 생년월일 입력 */}
                            <div className="flex flex-col items-center">
                                <div className="relative w-full max-w-xs">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={birthdate}
                                        onChange={(e) => setBirthdate(e.target.value)}
                                        placeholder="생년월일 (YYYY-MM-DD)"
                                        className="w-full p-3 pl-10 bg-white border-2 border-gray-300 rounded-lg text-center focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <p className="text-sm text-gray-600 mt-2">태어난 날을 알려주십시오.</p>
                            </div>
                        </div>
                        <div className="mt-8 text-center">
                             <button onClick={handleSubmit} className="px-10 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-105">
                                스승님께 올리기
                            </button>
                        </div>
                    </div>
                 </div>
            </div>

            {/* 쪽지 (클릭 전) */}
            {!animationState.expandNote && (
                <div 
                    onClick={handleNoteClick}
                    className={`absolute bottom-1/2 left-1/2 -translate-x-1/2 cursor-pointer transition-all duration-500 ease-out
                    ${animationState.showNote ? 'opacity-100 translate-y-1/2' : 'opacity-0 translate-y-full'}
                `}>
                    <img 
                        src="https://placehold.co/100x140/fdf6e3/333333?text=쪽지" 
                        alt="쪽지" 
                        className="w-24 h-32 drop-shadow-2xl hover:scale-110 transition-transform"
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x140/png?text=Note+Error'; }}
                    />
                    <p className="text-white text-center mt-4 font-gaegu text-lg animate-pulse">쪽지를 눌러 기록하십시오.</p>
                </div>
            )}
        </div>
    );
}

export default App;
