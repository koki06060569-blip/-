document.addEventListener('DOMContentLoaded', () => {
    // 必要なHTML要素を取得
    const analyzeButton = document.getElementById('analyze-button');
    const englishInput = document.getElementById('english-input');
    // 結果出力エリアをリストとして扱うために id を変更（または新しい要素を追加）
    const highlightedOutput = document.getElementById('highlighted-output');
    const hintTagsContainer = document.getElementById('hint-tags');

    // =========================================================
    // 辞書定義
    // =========================================================
    // S: be動詞・助動詞リスト
    const functionalVerbs = [
        'is', 'are', 'was', 'were', 'am', 'be', // Be動詞
        'do', 'does', 'did', // Do動詞
        'have', 'has', 'had', // Have動詞
        'can', 'could', 'will', 'would', 'may', 'might', 'must', 'should', 'ought' // 助動詞
    ];
    // V: 前置詞リスト
    const prepositions = [
        'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'from', 
        'about', 'after', 'before', 'under', 'over', 'through', 'into', 'upon'
    ];
    // V: 接続詞リスト（例として一部のみ）
    const conjunctions = [
        'and', 'but', 'or', 'so', 'because', 'although', 'while', 
        'if', 'when', 'that', 'which', 'who', 'where'
    ];

    // =========================================================
    // 1. 文を分割するロジック
    // =========================================================
    function splitTextIntoSentences(text) {
        // ピリオド、疑問符、感嘆符で文章を分割し、記号を保持する
        // 最後に空の要素をフィルタリング
        const sentences = text.match(/[^.!?]+[.!?]/g) || [];
        
        // 分割できなかった場合、残りのテキストを一文として扱う
        if (sentences.length === 0 && text.trim().length > 0) {
            sentences.push(text.trim());
        }
        
        return sentences;
    }

    // =========================================================
    // 2. 色付け
    // =========================================================
    function analyzeAndHighlight(sentence) {
        // 句読点やスペースで単語を分割
        const words = sentence.match(/\b\w+'?\w*\b|[.,!?;:"-]/g) || [];
        
        let htmlOutput = '';
        let foundSubject = false;
        let foundVerb = false;

        words.forEach((word, index) => {
            const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
            let className = ''; 
            let tooltip = '';

            // 句読点（ピリオドなど）はそのまま出力
            if (word.match(/[.,!?;:"-]/)) {
                htmlOutput += word + ' ';
                return; 
            }

            // 🟥 Be動詞/助動詞の強調 (文の機能)
            if (functionalVerbs.includes(cleanWord)) {
                className = 'is-functional-verb'; // 新しいクラス名
                tooltip = '機能動詞 (時制/状態)';
            }
            
            // 🟦 前置詞の強調 (飾りの始まり)
            else if (prepositions.includes(cleanWord)) {
                className = 'is-preposition'; // 新しいクラス名
                tooltip = '前置詞 (飾り句の開始)';
            }
            
            // 🟨 接続詞の強調 (つなぎ)
            else if (conjunctions.includes(cleanWord)) {
                className = 'is-connector';
                tooltip = '接続詞 (文をつなぐ単語)';
            }

            // 単語をspanタグで囲む
            if (className) {
                 htmlOutput += `<span class="${className}" data-tip="${tooltip}">${word}</span> `;
            } else {
                 htmlOutput += word + ' ';
            }
        });

        // 箇条書きとして整形して返す
        return `<li>${htmlOutput.trim()}</li>`;
    }

    // ... (checkGrammarHints関数は変更なしで再利用) ...
    function checkGrammarHints(sentence) {
        // ... (省略: 前回の checkGrammarHints のコードを貼り付け) ...
        let detectedHints = new Set();
        const lowerSentence = sentence.toLowerCase();

        // 1. 完了形
        if (lowerSentence.includes('have') || lowerSentence.includes('has') || lowerSentence.includes('had')) {
            detectedHints.add('完了形 (Perfect Tense) の可能性');
        }

        // 2. be動詞
        if (lowerSentence.includes('is ') || lowerSentence.includes('are ') || lowerSentence.includes('was ') || lowerSentence.includes('were ')) {
            detectedHints.add('be動詞を用いた文法');
        }
        
        // 3. 不定詞
        if (lowerSentence.includes(' to ')) {
            detectedHints.add('不定詞 (Infinitive) の可能性');
        }

        // 4. 接続詞
        if (lowerSentence.includes(' because ') || lowerSentence.includes(' although ') || lowerSentence.includes(' when ')) {
            detectedHints.add('複文（接続詞）');
        }

        const hints = Array.from(detectedHints);

        if (hints.length === 0) {
            return '<p class="placeholder-text">検出された文法はありませんでした。</p>';
        }

        return hints.map(hint => `<span class="grammar-tag">${hint}</span>`).join(' ');
    }


    // =========================================================
    // 3. ボタンクリックイベント
    // =========================================================
    analyzeButton.addEventListener('click', () => {
        const text = englishInput.value.trim();

        if (text === '') {
            highlightedOutput.innerHTML = '<p class="placeholder-text">英文を入力してください。</p>';
            hintTagsContainer.innerHTML = '<p class="placeholder-text">（分析ボタンを押すとヒントが表示されます）</p>';
            alert('英文を入力してください。');
            return;
        }

        // 1. テキストを文ごとに分割
        const sentences = splitTextIntoSentences(text);
        let listHtml = '<ul>';
        
        // 2. 各文に対してSVOC推定を実行
        sentences.forEach(sentence => {
            listHtml += analyzeAndHighlight(sentence);
        });
        listHtml += '</ul>';

        // 3. 結果を表示
        highlightedOutput.innerHTML = listHtml;
        
        // 4. 文法ヒントは文章全体に対して一度だけ実行
        hintTagsContainer.innerHTML = checkGrammarHints(text);

        //クリックしたら強調表示されるようにする
        setupReadingPointer();
    });
});

function setupReadingPointer() {
    // 新しく挿入されたすべての箇条書きアイテム（li）を取得
    const listItems = highlightedOutput.querySelectorAll('li');

    listItems.forEach(item => {
        // 各アイテムにクリックされたときの処理を設定
        item.addEventListener('click', () => {
            // 現在クリックされたアイテムが既にアクティブか確認
            const isActive = item.classList.contains('is-active');

            // 1. まず、他のすべてのアイテムからアクティブクラスを解除
            listItems.forEach(li => {
                li.classList.remove('is-active');
            });

            // 2. アクティブでなければ（つまり、新たに強調したい場合）、アクティブクラスを付ける
            if (!isActive) {
                item.classList.add('is-active');
                
                // 【教育的な工夫】クリック時にその文に軽くスクロール
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            // 3. 既にアクティブであれば（つまり、解除したい場合）、解除したまま何もつけない
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // 必要なHTML要素を取得
    const analyzeButton = document.getElementById('analyze-button');
    const englishInput = document.getElementById('english-input');
    const highlightedOutput = document.getElementById('highlighted-output');
    const hintTagsContainer = document.getElementById('hint-tags');
    // 🌟 追加するリセットボタンの取得 🌟
    const resetButton = document.getElementById('reset-button');
    
    // ... (辞書定義、関数の定義は省略) ...
    
    
    // =========================================================
    // 🌟 4. リセットボタンのイベント処理を追加 🌟
    // =========================================================
    resetButton.addEventListener('click', () => {
        // 1. 入力エリアのテキストを空にする
        englishInput.value = '';
        
        // 2. 分析結果エリアもクリアする（画面をリフレッシュする）
        highlightedOutput.innerHTML = '<p class="placeholder-text">ここに色分けされた英文が表示されます。</p>';
        hintTagsContainer.innerHTML = '<p class="placeholder-text">（分析ボタンを押すとヒントが表示されます）</p>';
    });

    // =========================================================
    // 5. 分析ボタンのイベント処理 (既存のロジック)
    // =========================================================
    analyzeButton.addEventListener('click', () => {
        // ... (既存の分析ロジックは変更なし) ...
    });

    // ... (setupReadingPointer関数などは省略) ...
});