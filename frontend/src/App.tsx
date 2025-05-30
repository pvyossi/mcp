import { useState, useEffect } from 'react';
import './App.css';

// ChatMessageインターフェース: チャットメッセージの構造を定義します。
// sender: メッセージの送信者 ('user' または 'ai')
// message: メッセージの本文 (文字列)
interface ChatMessage {
  sender: 'user' | 'ai';
  message: string;
}

function App() {
  // --- ステート変数 ---
  // inputValue: テキスト入力フィールドの現在の値を保持するステート。ユーザーが入力するたびに更新されます。
  const [inputValue, setInputValue] = useState('');
  // chatHistory: チャットの会話履歴を保持するステート。ChatMessageオブジェクトの配列です。
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  // userId: 現在のユーザーを識別するためのID。バックエンドに送信され、ユーザーごとの会話コンテキストを管理するために使用されます。
  // このデモでは固定値 "test-user" を使用していますが、実際のアプリケーションではUUIDを生成するなどして一意性を確保します。
  const [userId, setUserId] = useState('test-user'); // Or generate a UUID

  // (参考) UUIDを生成する関数 (このデモでは使用していません)
  // const generateUUID = () => {
  //   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  //     var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
  //     return v.toString(16);
  //   });
  // };

  // useEffectフック: コンポーネントのマウント時に実行される処理 (このデモではuserIdの動的設定はコメントアウト)
  useEffect(() => {
    // 必要であれば、ここでUUIDを生成してuserIdステートを更新します。
    // setUserId(generateUUID());
  }, []); // 空の依存配列は、コンポーネントがマウントされたときに一度だけ実行されることを意味します。


  // --- イベントハンドラ ---
  // handleSendMessage: ユーザーがメッセージを送信したときに呼び出される非同期関数。
  const handleSendMessage = async () => {
    // 入力値が空か、空白文字のみの場合は処理を中断します。
    if (inputValue.trim() === '') return;

    // ユーザーのメッセージをChatMesssageオブジェクトとして作成します。
    const userMessage: ChatMessage = { sender: 'user', message: inputValue };
    // chatHistoryステートを更新し、新しいユーザーメッセージを追加します。
    // (既存の履歴 ...prevHistory に新しいメッセージ userMessage を結合)
    setChatHistory(prevHistory => [...prevHistory, userMessage]);

    try {
      // バックエンドAPI にPOSTリクエストを送信します。
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chat`, {
        method: 'POST', // HTTPメソッド
        headers: {
          'Content-Type': 'application/json', // リクエストボディの形式をJSONとして指定
        },
        // リクエストボディ: user_idとユーザーのメッセージをJSON文字列に変換して送信します。
        // このuser_idにより、バックエンドはどのユーザーの会話かを識別し、コンテキストを管理できます。
        body: JSON.stringify({ user_id: userId, message: inputValue }),
      });

      // レスポンスが正常でない場合 (例: サーバーエラー)、エラーをスローします。
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      // レスポンスボディをJSONとしてパースします (バックエンドからの応答は { "reply": "AIのメッセージ" } 形式)。
      const data = await response.json();
      // AIの応答をChatMessageオブジェクトとして作成します。
      const aiMessage: ChatMessage = { sender: 'ai', message: data.reply };
      // chatHistoryステートを更新し、AIの応答メッセージを追加します。
      setChatHistory(prevHistory => [...prevHistory, aiMessage]);

    } catch (error) {
      // API通信中にエラーが発生した場合の処理。
      console.error('Failed to send message or get reply:', error); // エラーをコンソールに出力
      // エラーメッセージをAIのメッセージとしてチャット履歴に追加し、ユーザーに通知します。
      const errorMessage: ChatMessage = { sender: 'ai', message: 'Sorry, something went wrong.' };
      setChatHistory(prevHistory => [...prevHistory, errorMessage]);
    }

    // メッセージ送信後、入力フィールドをクリアします。
    setInputValue('');
  };

  // handleKeyPress: テキスト入力フィールドでキーが押されたときに呼び出される関数。
  // Enterキーが押された場合、handleSendMessage関数を呼び出してメッセージを送信します。
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  // --- JSXレンダリング ---
  // チャットインターフェースの構造を定義します。
  return (
    <div className="chat-container"> {/* チャット全体のコンテナ */}
      <div className="chat-header"> {/* ヘッダー部分 */}
        <h1>AI Chat</h1>
        <p>User ID: {userId}</p> {/* 現在のユーザーIDを表示 */}
      </div>
      <div className="message-list"> {/* メッセージ表示エリア */}
        {/* chatHistory配列をマップして、各メッセージを画面に表示します。 */}
        {/* indexをkeyとして使用していますが、より安定したIDがある場合はそちらを推奨します。 */}
        {chatHistory.map((chat, index) => (
          // 各メッセージのコンテナ。送信者によって 'user' または 'ai' クラスが適用され、CSSでスタイルが区別されます。
          <div key={index} className={`message ${chat.sender}`}>
            <p>{chat.message}</p> {/* メッセージ本文 */}
          </div>
        ))}
      </div>
      <div className="message-input-area"> {/* メッセージ入力エリア */}
        <input
          type="text"
          value={inputValue} // 入力フィールドの値をinputValueステートとバインド
          onChange={(e) => setInputValue(e.target.value)} // 入力値が変更されるたびにinputValueステートを更新
          onKeyPress={handleKeyPress} // キープレスイベントを処理 (Enterキーでの送信のため)
          placeholder="Type your message..." // 入力フィールドのプレースホルダー
        />
        <button onClick={handleSendMessage}>Send</button> {/* 送信ボタン。クリックでhandleSendMessageを呼び出し */}
      </div>
    </div>
  );
}

export default App;
