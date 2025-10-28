import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Consultant Journey — Full interactive prototype
// - 繁體中文題庫（模組化、含解析、補充案例與外部延伸連結）
// - 每題選項隨機排序
// - 答題後彈出獨立解析卡片（含解析摘要、補充案例、延伸連結）

export default function ConsultantJourney() {
  const [step, setStep] = useState(0); // 0: intro/module select, 1: playing, 999: finished
  const [score, setScore] = useState(60);
  const [chapter, setChapter] = useState(0); // index into modules
  const [questionIndex, setQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [showHintBox, setShowHintBox] = useState(false);

  const clamp = (v) => Math.max(0, Math.min(100, v));

  const shuffle = (array) => {
    // non-mutating shuffle
    return array
      .map((item) => ({ item, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((p) => p.item);
  };

  // Full modules and question bank (繁體中文)
  const modules = [
    {
      id: 'module-1',
      title: '模組一：專案啟動與規劃 (Scope & Foundation)',
      intro: '確保專案目標、範疇與技術基礎的清晰度。',
      questions: [
        {
          id: 'm1-q1',
          q: '客戶提出新增 LINE 通知功能，但此項目不在 SOW 範圍且會導致延期。你會怎麼處理？',
          options: [
            {
              text: '立即吸收變更以維持客戶關係。',
              result: '❌ 直接吸收變更會影響時程與預算，且未經過流程。',
              trust: -10,
              team: -10,
              hint: '應啟動變更請求（CR）流程以評估影響。',
              case: '某金融案中，PM 未評估變更而造成後期大量重工與客訴，後續調整導致成本激增。',
              links: ['https://www.pmi.org/', 'https://www.atlassian.com/work-management/change-request']
            },
            {
              text: '堅持拒絕客戶，要求完全遵守原 SOW。',
              result: '⚠️ 拒絕雖保範圍但缺乏彈性，可能損害合作關係。',
              trust: -5,
              team: 0,
              hint: '可透過 CR 流程提出正式方案並協商優先順序。',
              case: '一案因過度堅持而導致客戶流失，後續信任修復困難。',
              links: ['https://hbr.org/', 'https://www.pmi.org/']
            },
            {
              text: '啟動變更請求（CR）流程，評估時間、成本及可行性後決定。',
              result: '✅ 正確的專案變更管理方式。',
              trust: +10,
              team: +10,
              hint: 'SOW 定義專案範圍；變更需透明且可追蹤。',
              case: '在一個 CRM 導入案，PM 用 CR 評估並取得核准，雙方同意後追加功能成為下一階段。',
              links: ['https://www.pmi.org/', 'https://www.atlassian.com/']
            },
            {
              text: '先讓工程師先做，事後再向業務追收費用。',
              result: '❌ 先做再談會造成責任模糊與成本不明。',
              trust: -10,
              team: -15,
              hint: '事前協商並簽核變更較為專業。',
              case: '有案例中因先行開發導致預算超支且客戶拒付，產生法律爭議。',
              links: ['https://www.pmi.org/']
            }
          ]
        },
        {
          id: 'm1-q2',
          q: 'UI 設計師希望極簡化，但業務主管要求保留大量操作提示，雙方僵持，PM 應如何處理？',
          options: [
            {
              text: '將決策交給雙方主管協調。',
              result: '⚠️ 將責任推給主管可能無法有效取得共識。',
              trust: -5,
              team: -10,
              hint: 'PM 應主動協調並促成共識。',
              case: '在 HR 系統專案中，PM 組織工作坊最終找到折衷方案。',
              links: ['https://www.atlassian.com/team-playbook/plays/team-alignment', 'https://www.interaction-design.org/']
            },
            {
              text: '安排原型工作坊，讓雙方列出優先順序並以 user stories 驗證。',
              result: '✅ 透過原型具象化可快速建立共識。',
              trust: +10,
              team: +15,
              hint: '使用 prototype 或 A/B 測試來驗證設計假設。',
              case: '某 SaaS 案使用 prototype 減少了 40% 的返工。',
              links: ['https://www.atlassian.com/team-playbook/plays/assumption-validation', 'https://www.nngroup.com/']
            },
            {
              text: '忽略業務要求，優先考慮 UX 設計。',
              result: '❌ 片面考量使用者或業務皆不妥。',
              trust: -10,
              team: -15,
              hint: '需要平衡使用者需求與業務目標。',
              case: '曾有專案因忽視業務需求導致採用率低。',
              links: ['https://hbr.org/']
            },
            {
              text: '直接採納業務主管意見以避免爭議。',
              result: '⚠️ 以權力而非專業決策，風險較高。',
              trust: -5,
              team: -5,
              hint: 'PM 應以資料與目標為依據調整決策。',
              case: '僅為避免衝突而採納的決策，後續發現影響了使用者流失率。',
              links: ['https://www.pmi.org/']
            }
          ]
        },
        {
          id: 'm1-q3',
          q: '客戶提供的需求文件缺少關鍵欄位（例如使用者身分或頻率），你會？',
          options: [
            {
              text: '先進行模擬分析，暫用假設值繼續設計。',
              result: '⚠️ 可在短期內推進，但需標註假設並盡快確認。',
              trust: 0,
              team: +5,
              hint: '若使用假設，應記錄假設條件並盡速驗證。',
              case: '某案使用假設數據完成 prototype，後經驗證發現需要小幅調整。',
              links: ['https://www.pmi.org/']
            },
            {
              text: '提供一份資料清單並協助客戶整理，協商交付時間。',
              result: '✅ 最專業的做法，協助客戶準備正確資料。',
              trust: +10,
              team: +10,
              hint: '顧問應主動協助客戶準備可用資料，縮短迭代時間。',
              case: '在多家銀行案中，顧問提供清單後資料品質顯著提高。',
              links: ['https://www.atlassian.com/']
            },
            {
              text: '拒絕繼續，等待客戶整理完整資料。',
              result: '❌ 被動等待會延誤專案進度。',
              trust: -10,
              team: -10,
              hint: '主動支援比被動等待更能建立信任。',
              case: '因被動等待導致專案停擺，最後客戶改找他方協助。',
              links: ['https://hbr.org/']
            }
          ]
        }
      ]
    },
    {
      id: 'module-2',
      title: '模組二：專案執行與風險管理 (Execution & Risk)',
      intro: '專注於風險管理、技術限制與執行的彈性。',
      questions: [
        {
          id: 'm2-q1',
          q: '第三方供應商通知 API 延遲 3 個月，會影響關鍵整合測試，你會如何應對？',
          options: [
            {
              text: '宣布專案失敗，重新評估合約。',
              result: '❌ 放棄過早，應先嘗試應變。',
              trust: -10,
              team: -15,
              hint: '應先啟動備援方案（Plan B）並使用 mock data。',
              case: '某電商案使用 mock data 進行測試，維持整體進度。',
              links: ['https://www.atlassian.com/risk-management', 'https://www.pmi.org/']
            },
            {
              text: '立刻尋找替代供應商並停工等待回覆。',
              result: '⚠️ 替代方案有其成本與風險，需同時啟用其他措施。',
              trust: 0,
              team: -5,
              hint: '同時使用 mock data 與協商較為平衡。',
              case: '替代供應商需時間評估，短期仍靠模擬資料維繫測試。',
              links: ['https://www.pmi.org/']
            },
            {
              text: '使用 mock data 持續測試系統內部流程，並與供應商協商交付期與補償。',
              result: '✅ 最實務的應對：維持開發節奏並管理風險。',
              trust: +10,
              team: +15,
              hint: '風險日誌與替代方案可減少專案停擺風險。',
              case: '某物流整合案以 mock data 測試結構，提前驗證 UI 與錯誤處理。',
              links: ['https://www.scrum.org/', 'https://www.atlassian.com/risk-management']
            },
            {
              text: '要求工程師加班等待 API 上線。',
              result: '❌ 低效率且可能造成團隊倦怠。',
              trust: -10,
              team: -20,
              hint: '應維持人力與節奏，避免燃燒團隊。',
              case: '一案因過度加班造成大規模人員流失。',
              links: ['https://hbr.org/']
            }
          ]
        },
        {
          id: 'm2-q2',
          q: 'PdM 希望與舊 ERP 做即時雙向整合，但技術限制明顯，你會？',
          options: [
            {
              text: '直接拒絕 PdM 要求。',
              result: '⚠️ 拒絕缺乏溝通與替代方案。',
              trust: -5,
              team: -10,
              hint: '應以事實說明技術限制並提出替代方案。',
              case: '在製造業案中，採取暫時性 Excel 匯入匯出方案，並納入未來 ERP 升級計畫。',
              links: ['https://www.thoughtworks.com/']
            },
            {
              text: '與工程團隊確認可行性，並檢視 IT roadmap 與替代方案。',
              result: '✅ 正確：平衡技術限制與業務需求。',
              trust: +10,
              team: +15,
              hint: 'PM 應協調 IT、工程與業務，找出妥協方案。',
              case: '某案以單向 API 加入緩衝層，達到短期需求。',
              links: ['https://www.pmi.org/', 'https://www.atlassian.com/']
            },
            {
              text: '強迫團隊找到解法並加快進度。',
              result: '❌ 不當管理方式，造成摩擦。',
              trust: -10,
              team: -20,
              hint: '應協助協調資源而非施壓。',
              case: '曾有專案因高壓管理而延誤與品質下降。',
              links: ['https://hbr.org/']
            },
            {
              text: '自己學程式嘗試繞過限制。',
              result: '⚠️ 非本職重点，應專注管理與溝通。',
              trust: -5,
              team: -5,
              hint: 'PM 的角色是協調與決策，而非代替工程師實作。',
              case: '有 PM 兼開發造成角色衝突與效率降低。',
              links: ['https://www.pmi.org/']
            }
          ]
        },
        {
          id: 'm2-q3',
          q: '專案測試階段發現重大資料品質問題（客戶資料有大量錯誤），你會？',
          options: [
            {
              text: '記錄問題並返回客戶，要求修正後再繼續。',
              result: '⚠️ 被動等待可能延誤時程。',
              trust: -5,
              team: -5,
              hint: '應協助建立資料校驗清單並提供範例。',
              case: '顧問提供資料檢核工具後，資料品質與測試效率顯著提升。',
              links: ['https://www.atlassian.com/']
            },
            {
              text: '先建立臨時資料清洗腳本，並協助客戶同步改善。',
              result: '✅ 積極協助客戶解決問題，並維持進度。',
              trust: +10,
              team: +10,
              hint: '建議同時提供資料上傳範本以降低錯誤。',
              case: '在某銀行案中，顧問協作寫出 ETL 腳本，大幅減少手動修正。',
              links: ['https://www.pmi.org/']
            },
            {
              text: '忽略資料問題，先推進其他功能。',
              result: '❌ 可能導致後續整合失敗。',
              trust: -10,
              team: -10,
              hint: '資料問題通常會影響系統正確性，應優先處理。',
              case: '忽視資料品質導致上線後大量錯誤。',
              links: ['https://hbr.org/']
            }
          ]
        }
      ]
    },
    {
      id: 'module-3',
      title: '模組三：進階溝通技巧 (Advanced Communication)',
      intro: '強化向客戶、團隊與主管的溝通能力，建立領導與信任。',
      questions: [
        {
          id: 'm3-q1',
          q: '客戶對交付成果強烈不滿並威脅終止合約，你會？',
          options: [
            {
              text: '立即承諾免費修復所有問題。',
              result: '❌ 此舉可能造成成本失控與先例問題。',
              trust: -10,
              team: -5,
              hint: '應傾聽並把不滿轉為正式變更項目，說明影響與費用。',
              case: '一案承諾免費修復後，後續多次額外要求，造成成本爆增。',
              links: ['https://hbr.org/', 'https://www.pmi.org/']
            },
            {
              text: '堅持依 PRD 執行，指出客戶記錯或誤解。',
              result: '⚠️ 硬碰易破壞關係，需用視覺工具澄清。',
              trust: -5,
              team: 0,
              hint: '用 prototype 與線框定位問題點更有效。',
              case: '用 prototype 澄清誤會後，雙方快速達成共識。',
              links: ['https://www.atlassian.com/', 'https://www.nngroup.com/']
            },
            {
              text: '傾聽並使用原型輔助溝通，將不滿轉為 CR 並說明時程與成本影響。',
              result: '✅ 理性處理衝突並保護雙方權益。',
              trust: +10,
              team: +5,
              hint: '維持冷靜並以專業工具協助說明。',
              case: 'PM 使用原型與記錄流程，成功化解終止風險。',
              links: ['https://www.pmi.org/', 'https://hbr.org/']
            },
            {
              text: '把問題推給設計師處理。',
              result: '❌ 推卸責任會傷害專業信任。',
              trust: -10,
              team: -15,
              hint: 'PM 應承擔溝通責任並主導協商。',
              case: '被動推諉導致客戶怒氣未消，後續賠償談判艱難。',
              links: ['https://www.pmi.org/']
            }
          ]
        },
        {
          id: 'm3-q2',
          q: '開發團隊士氣低落，你會怎麼做？',
          options: [
            {
              text: '要求大家專業完成工作並加速交付。',
              result: '❌ 壓力導向反而可能惡化士氣。',
              trust: -10,
              team: -20,
              hint: '應以支持者角色與團隊一起排除障礙。',
              case: 'PM 舉辦回顧會並調整優先順序後，士氣回升。',
              links: ['https://www.atlassian.com/team-playbook/plays/health-monitor', 'https://hbr.org/']
            },
            {
              text: '向主管申請增員以分散負荷。',
              result: '⚠️ 可能是解法之一，但需先檢視優先順序。',
              trust: 0,
              team: +5,
              hint: '優先檢視任務優先順序與流程改善。',
              case: '先優化流程後再申請資源，效果更好。',
              links: ['https://www.pmi.org/']
            },
            {
              text: '承認並支持團隊，檢視優先順序並向利害關係人請求時程調整。',
              result: '✅ 展現支持者角色與領導力。',
              trust: +10,
              team: +20,
              hint: '領導力常表現在支持團隊與保護團隊資源。',
              case: '調整時程後專案品質提升且人員挽留成功。',
              links: ['https://hbr.org/', 'https://www.pmi.org/']
            },
            {
              text: '責怪利害關係人並置之不理。',
              result: '❌ 無助於問題解決。',
              trust: -10,
              team: -15,
              hint: '應引導團隊聚焦可控範圍。',
              case: '責怪行為導致內部對立加深。',
              links: ['https://hbr.org/']
            }
          ]
        },
        {
          id: 'm3-q3',
          q: '專案落後兩週且有兩個高風險，向主管報告時你會？',
          options: [
            {
              text: '只呈現已完成工作以避免負面印象。',
              result: '❌ 不透明會削弱信任與決策品質。',
              trust: -10,
              team: -5,
              hint: '透明是建立信任的基礎。',
              case: '不透明導致主管無法及時支援，問題惡化。',
              links: ['https://www.pmi.org/']
            },
            {
              text: '誠實報告進度、風險與已啟動的 Plan B，並提出需要的決策點。',
              result: '✅ 正確且專業的報告方式。',
              trust: +10,
              team: +10,
              hint: '報告應包含風險、影響與可選方案。',
              case: '一位 PM 的透明報告讓主管迅速核准資源，阻止延誤擴大。',
              links: ['https://www.atlassian.com/agile/project-management/status-report', 'https://hbr.org/']
            },
            {
              text: '把責任推給供應商與技術問題。',
              result: '⚠️ 指責他人而無建議方案並不可取。',
              trust: -5,
              team: -10,
              hint: '同時提出建議方案與風險緩解計畫更具說服力。',
              case: '以指責為主的報告未能換取支援。',
              links: ['https://www.pmi.org/']
            },
            {
              text: '請主管介入處理供應商細節。',
              result: '⚠️ 過度依賴主管，減少 PM 主導性。',
              trust: -5,
              team: -5,
              hint: '主管介入前應先提出已嘗試的行動與選項。',
              case: '主管介入但沒有清楚需求時，反而拖延決策。',
              links: ['https://hbr.org/']
            }
          ]
        }
      ]
    }
  ];

  // guard current module/question
  const currentModule = modules[chapter] ?? null;
  const currentQuestion = useMemo(() => {
    if (!currentModule) return null;
    const q = currentModule.questions[questionIndex] ?? null;
    if (!q) return null;
    return { ...q, options: shuffle(q.options) };
  }, [chapter, questionIndex]);

  const startModule = (index) => {
    setChapter(index);
    setQuestionIndex(0);
    setStep(1);
    setScore(60);
    setFeedback(null);
    setShowHintBox(false);
  };

  const handleChoice = (option) => {
    if (!option) return;
    // 計算綜合分數：信任值和團隊默契的平均
    const trustScore = option.trust || 0;
    const teamScore = option.team || 0;
    const combinedScore = Math.round((trustScore + teamScore) / 2);
    
    setScore((s) => clamp(s + combinedScore));
    setFeedback(option);
    setShowHintBox(true);
  };

  const handleNext = () => {
    setShowHintBox(false);
    setFeedback(null);
    // next question or module
    if (!currentModule) return;
    if (questionIndex < currentModule.questions.length - 1) {
      setQuestionIndex((q) => q + 1);
    } else if (chapter < modules.length - 1) {
      // auto-advance to next module
      setChapter((c) => c + 1);
      setQuestionIndex(0);
    } else {
      setStep(999);
    }
  };

  const resetAll = () => {
    setStep(0);
    setScore(60);
    setChapter(0);
    setQuestionIndex(0);
    setFeedback(null);
    setShowHintBox(false);
  };

  const downloadCertificate = async () => {
    const certificateElement = document.getElementById('certificate');
    if (!certificateElement) return;

    try {
      // 等待一下確保所有內容都渲染完成
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(certificateElement, {
        backgroundColor: '#1e293b',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: certificateElement.scrollHeight,
        width: certificateElement.scrollWidth,
        scrollX: 0,
        scrollY: 0
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      const pdfWidth = 297; // A4 landscape width
      const pdfHeight = 210; // A4 landscape height
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // 計算適合的尺寸
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      // 居中放置
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      
      // 獲取等級名稱
      let levelName = '實習顧問';
      if (score >= 80) levelName = '傳奇顧問';
      else if (score >= 70) levelName = '玩家顧問';
      else if (score >= 60) levelName = '新手顧問';
      
      pdf.save(`顧問養成計劃證書_${levelName}_${new Date().toLocaleDateString('zh-TW')}.pdf`);
    } catch (error) {
      console.error('PDF 生成失敗:', error);
      alert('證書下載失敗，請稍後再試');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-3 sm:p-6">
      <div className="max-w-5xl mx-auto bg-slate-900/60 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-700">
        <header className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">顧問養成計劃</h1>
          <p className="text-sm sm:text-base text-gray-300 mb-4">
            透過互動式情境題庫，提升你的專業顧問技能
          </p>
        </header>

        <main className="grid grid-cols-12 gap-6">
          <section className="col-span-12 lg:col-span-8">
            {step === 0 && (
              <div>
                {/* 說明區塊 - 明顯區分設計 */}
                <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg sm:rounded-xl border border-blue-500/30">
                  <div className="flex items-center mb-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    <h2 className="text-lg sm:text-xl font-bold text-blue-400">開始你的顧問之路</h2>
                  </div>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    歡迎來到顧問能力訓練系統！選擇下方任一模組開始挑戰，或依序完成所有模組獲得完整訓練體驗。
                    每個模組都包含實務情境題目，幫助你提升專業顧問技能。
                  </p>
                </div>

                {/* 模組選項 - 卡片式設計 */}
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-200 mb-3 sm:mb-4 flex items-center">
                    <span className="w-1 h-5 sm:h-6 bg-amber-400 rounded mr-3"></span>
                    測驗模組說明
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {modules.map((m, i) => (
                      <div
                        key={m.id}
                        className="text-left p-4 sm:p-5 rounded-lg sm:rounded-xl bg-slate-800/60 border border-slate-600/50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="inline-block w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs sm:text-sm font-bold rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                {i + 1}
                              </span>
                              <h4 className="font-bold text-gray-300 text-sm sm:text-base">
                                {m.title}
                              </h4>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-300 mb-3 ml-10 sm:ml-11">{m.intro}</p>
                            <div className="flex items-center ml-10 sm:ml-11 flex-wrap gap-2">
                              <span className="text-xs bg-slate-700 text-gray-300 px-2 py-1 rounded-full">
                                {m.questions.length} 題
                              </span>
                              <span className="text-xs text-gray-400">
                                約 {m.questions.length * 2} 分鐘
                              </span>
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 主要行動按鈕 */}
                <div className="text-center">
                  <button 
                    onClick={() => startModule(0)} 
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-xl"
                  >
                    開始冒險
                  </button>
                </div>
              </div>
            )}

            {step === 1 && currentQuestion && (
              <motion.div
                key={`module-${currentModule.id}-q${currentQuestion.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 sm:p-6 bg-slate-800/50 rounded-lg"
              >
                <h3 className="text-lg sm:text-xl font-bold mb-1">{currentModule.title}</h3>
                <p className="text-xs sm:text-sm opacity-80 mb-3 sm:mb-4">{currentModule.intro}</p>
                <div className="bg-slate-900 p-3 sm:p-4 rounded">
                  {!feedback ? (
                    <>
                      <p className="mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">{currentQuestion.q}</p>
                      <div className="space-y-2 sm:space-y-3">
                        {currentQuestion.options.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleChoice(opt)}
                            className="w-full text-left p-3 sm:p-4 rounded bg-indigo-700 hover:bg-indigo-600 text-sm sm:text-base leading-relaxed transition-colors"
                          >
                            {opt.text}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-base sm:text-lg font-semibold mb-2">{feedback.result}</p>
                      <p className="text-xs sm:text-sm opacity-80 mb-3">💡 {feedback.hint}</p>
                      <div className="bg-white/5 p-3 rounded mb-3">
                        <div className="font-medium text-sm sm:text-base">補充案例</div>
                        <p className="text-xs sm:text-sm opacity-80 mt-1 leading-relaxed">{feedback.case}</p>
                      </div>
                      <div className="mb-3">
                        <div className="font-medium text-sm sm:text-base">延伸學習</div>
                        <ul className="text-xs sm:text-sm opacity-80 list-disc list-inside mt-1 space-y-1">
                          {feedback.links && feedback.links.map((l, i) => (
                            <li key={i}>
                              <a className="underline break-all" href={l} target="_blank" rel="noreferrer">
                                {l}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button onClick={handleNext} className="px-4 py-2 bg-emerald-500 rounded text-sm sm:text-base font-medium">
                          下一題
                        </button>
                        <button
                          onClick={() => {
                            setFeedback(null);
                            setShowHintBox(false);
                          }}
                          className="px-4 py-2 bg-slate-700 rounded text-sm sm:text-base"
                        >
                          關閉解析
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 text-xs opacity-80">
                  章節 {chapter + 1} / {modules.length} • 題目 {questionIndex + 1} / {currentModule.questions.length}
                </div>
              </motion.div>
            )}

            {step === 999 && (
              <motion.div
                id="certificate"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative"
              >
                {/* 證書背景 */}
                <div className="relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 p-8 rounded-2xl border-4 border-double border-yellow-400/50 shadow-2xl">
                  {/* 裝飾角落 */}
                  <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-yellow-400/60"></div>
                  <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-yellow-400/60"></div>
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-yellow-400/60"></div>
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-yellow-400/60"></div>

                  {/* 證書標題 */}
                  <div className="text-center mb-6">
                    <h1 className="text-xl font-bold text-yellow-400 mb-2">🎓 顧問能力認證證書</h1>
                    <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto"></div>
                  </div>

                  {/* 恭喜文字 */}
                  <div className="text-center mb-6">
                    <p className="text-lg text-gray-200">恭喜你完成</p>
                    <h2 className="text-2xl font-bold text-white mb-2">顧問之路挑戰</h2>
                    <p className="text-sm text-gray-300">經過專業情境測試，你的顧問等級為：</p>
                  </div>

                  {/* 等級徽章 - 大型顯示 */}
                  <div className="text-center mb-8">
                    {score >= 80 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        className="inline-block"
                      >
                        <div className="relative bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 p-8 rounded-2xl mb-4 shadow-2xl border-2 border-emerald-300">
                          <div className="text-white text-center">
                            <div className="text-4xl font-black mb-2">LEGEND</div>
                            <div className="text-lg font-semibold opacity-90">TIER</div>
                          </div>
                          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                            MAX LEVEL
                          </div>

                        </div>
                        <h3 className="text-3xl font-bold text-white mb-2">傳奇顧問</h3>
                        <p className="text-gray-200 max-w-md mx-auto">
                          完美展現專業顧問的智慧與領導力！你已達到顧問的最高境界，能夠處理最複雜的專案挑戰。
                        </p>
                      </motion.div>
                    )}
                    
                    {score >= 70 && score < 80 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        className="inline-block"
                      >
                        <div className="relative bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 p-8 rounded-2xl mb-4 shadow-2xl border-2 border-yellow-300">
                          <div className="text-white text-center">
                            <div className="text-4xl font-black mb-2">EXPERT</div>
                            <div className="text-lg font-semibold opacity-90">TIER</div>
                          </div>
                          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                            SENIOR
                          </div>

                        </div>
                        <h3 className="text-3xl font-bold text-white mb-2">玩家顧問</h3>
                        <p className="text-gray-200 max-w-md mx-auto">
                          展現出色的專業判斷與團隊協作能力！你具備豐富的實務經驗，能獨當一面處理複雜專案。
                        </p>
                      </motion.div>
                    )}
                    
                    {score >= 60 && score < 70 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        className="inline-block"
                      >
                        <div className="relative bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-8 rounded-2xl mb-4 shadow-2xl border-2 border-blue-300">
                          <div className="text-white text-center">
                            <div className="text-4xl font-black mb-2">QUALIFIED</div>
                            <div className="text-lg font-semibold opacity-90">TIER</div>
                          </div>
                          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                            CERTIFIED
                          </div>

                        </div>
                        <h3 className="text-3xl font-bold text-white mb-2">新手顧問</h3>
                        <p className="text-gray-200 max-w-md mx-auto">
                          具備基本顧問技能，持續精進可達更高水準！你已掌握核心概念，繼續練習將更上一層樓。
                        </p>
                      </motion.div>
                    )}
                    
                    {score < 60 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        className="inline-block"
                      >
                        <div className="relative bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 p-8 rounded-2xl mb-4 shadow-2xl border-2 border-orange-300">
                          <div className="text-white text-center">
                            <div className="text-4xl font-black mb-2">LEARNING</div>
                            <div className="text-lg font-semibold opacity-90">TIER</div>
                          </div>
                          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                            TRAINEE
                          </div>

                        </div>
                        <h3 className="text-3xl font-bold text-white mb-2">實習顧問</h3>
                        <p className="text-gray-200 max-w-md mx-auto">
                          需要更多實務經驗，建議重複練習強化技能！每次挑戰都是成長的機會，繼續加油！
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* 分數展示 */}
                  <div className="flex justify-center mb-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold mb-2">
                        <span className={score >= 70 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}>
                          {score}
                        </span>
                      </div>
                      <div className="text-base text-gray-300 font-medium">顧問分數</div>
                    </div>
                  </div>

                  {/* 測驗日期 */}
                  <div className="text-center mb-6">
                    <p className="text-xs text-gray-400">測驗日期：{new Date().toLocaleDateString('zh-TW')}</p>
                  </div>



                  {/* 按鈕 */}
                  <div className="flex gap-4 justify-center">
                    <button 
                      onClick={downloadCertificate} 
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-lg"
                    >
                      下載證書
                    </button>
                    <button 
                      onClick={resetAll} 
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
                    >
                      再次挑戰
                    </button>
                  </div>

                  {/* 分享提示 */}
                  <div className="text-center mt-6">
                    <p className="text-xs text-gray-400">下載你的專業顧問證書，與同事分享你的成就！</p>
                  </div>
                </div>
              </motion.div>
            )}
          </section>

          <aside className="col-span-12 lg:col-span-4 order-first lg:order-last">
            <div className="p-3 sm:p-4 bg-slate-800/40 rounded sticky top-6">
              <h4 className="font-semibold text-sm sm:text-base">評分機制說明</h4>
              <div className="mt-2 sm:mt-3 text-xs sm:text-sm opacity-80 space-y-1 sm:space-y-2">
                <div>
                  <div className="font-medium text-green-400">✅ 正確選擇：+10 分</div>
                  <div className="text-xs">展現專業顧問思維與最佳實務</div>
                </div>
                <div>
                  <div className="font-medium text-yellow-400">⚠️ 尚可選擇：0 或 -5 分</div>
                  <div className="text-xs">部分正確但有改善空間</div>
                </div>
                <div>
                  <div className="font-medium text-red-400">❌ 錯誤選擇：-10 分</div>
                  <div className="text-xs">可能造成專案風險或關係損害</div>
                </div>
              </div>
              
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-700">
                <h5 className="font-semibold text-sm sm:text-base">目前分數</h5>
                <div className="mt-2 text-center">
                  <div className="text-2xl font-bold mb-1">
                    <span className={`${score >= 70 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {score}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300">顧問分數</div>
                </div>
                <div className="mt-2 text-xs opacity-70 text-center">
                  {score >= 80 && '傳奇顧問'}
                  {score >= 70 && score < 80 && '玩家顧問'}
                  {score >= 60 && score < 70 && '新手顧問'}
                  {score < 60 && '實習顧問'}
                </div>
              </div>

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-700">
                <h5 className="font-semibold text-sm sm:text-base">顧問等級說明</h5>
                <div className="text-xs opacity-80 mt-2 space-y-1">
                  <div>傳奇顧問：80+ 分</div>
                  <div>玩家顧問：70-79 分</div>
                  <div>新手顧問：60-69 分</div>
                  <div>實習顧問：60 分以下</div>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-700 lg:block hidden">
                <h5 className="font-semibold text-sm sm:text-base">測驗說明</h5>
                <ul className="text-xs opacity-80 list-disc list-inside mt-2 space-y-1">
                  <li>每題選項會隨機排列</li>
                  <li>答題後顯示詳細解析與案例</li>
                </ul>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}