from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg

# Pydanticモデル: APIリクエストとレスポンスのデータ構造を定義します。
# これにより、データの型検証が自動的に行われます。

class ChatRequest(BaseModel):
    """
    /api/chat エンドポイントへのリクエストボディの型定義。
    user_id: ユーザーを識別するための一意のID。
    message: ユーザーが送信したメッセージ文字列。
    """
    user_id: str
    message: str

class ChatResponse(BaseModel):
    """
    /api/chat エンドポイントからのレスポンスボディの型定義。
    reply: AIによって生成された応答メッセージ文字列。
    """
    reply: str

# 会話履歴のインメモリ（サーバーのメモリ上）ストレージ
# キーは user_id (文字列)、値はメッセージのリスト (文字列のリスト)。
# 例: {"user123": ["こんにちは", "今日の天気は？"], "user456": ["私の名前は太郎です"]}
# 注意: このデータはサーバーが再起動すると失われます。永続化のためにはデータベースなどが必要です。
conversation_history: dict[str, list[str]] = {}

app = FastAPI() # FastAPIアプリケーションインスタンスを作成

# AIによる応答生成ロジック
def generate_response(user_id: str, message: str) -> str:
    """
    ユーザーIDとメッセージに基づいてAIの応答を生成し、会話履歴を管理します。

    Args:
        user_id (str): ユーザーの一意の識別子。
        message (str): ユーザーからのメッセージ。

    Returns:
        str: AIによる応答メッセージ。
    """
    # ユーザーIDが会話履歴にまだ存在しない場合、新しい空のリストで初期化
    if user_id not in conversation_history:
        conversation_history[user_id] = []
    
    # 現在のメッセージを該当ユーザーの会話履歴に追加
    conversation_history[user_id].append(message)
    
    # 1. 名前の登録と応答 (例: 「私の名前は〇〇です」)
    # 正規表現を使用してメッセージから名前を抽出
    import re # 正規表現モジュールをインポート
    name_match = re.search(r"私の名前は(.+)です", message) # "私の名前は〇〇です" のパターンにマッチするか検索
    if name_match:
        name = name_match.group(1) # マッチした部分（〇〇）を取得
        # 取得した名前を特別な形式で会話履歴に保存し、後で参照できるようにする
        # これにより、AIがユーザーの名前を「覚える」ことができる (簡易的なコンテキスト保持)
        conversation_history[user_id].append(f"USER_NAME_IS:{name}")
        return f"こんにちは、{name}さん！" # 名前を含めた挨拶を返す

    # 2. キーワードに基づいた応答
    # "こんにちは" がメッセージに含まれている場合
    if "こんにちは" in message:
        return "こんにちは！" # シンプルな挨拶を返す
    
    # "名前は？" がメッセージに含まれている場合 (AI自身の名前を尋ねられたと解釈)
    if "名前は？" in message:
        user_name = None # ユーザーの名前を格納する変数を初期化
        # 過去の会話履歴を逆順に検索し、ユーザーが以前に名前を登録したか確認
        # (現在のメッセージは除くため [:-1] スライスを使用)
        for msg_history_item in reversed(conversation_history[user_id][:-1]): 
            if msg_history_item.startswith("USER_NAME_IS:"): # "USER_NAME_IS:" で始まる履歴があれば、それが名前登録
                user_name = msg_history_item.split(":")[1] # ":" で分割して名前部分を取得
                break # 名前が見つかったらループを抜ける
        
        if user_name:
            # ユーザーの名前が履歴にあれば、名前を呼んで応答 (コンテキスト活用)
            return f"{user_name}さん、こんにちは！私はAIです。"
        else:
            # ユーザーの名前が履歴になければ、AI自身の紹介と名前を尋ねる応答
            return "私はAIです。あなたのお名前は何ですか？"
            
    # "天気" がメッセージに含まれている場合
    if "天気" in message:
        return "今日の天気は晴れです！" # 固定の天気情報を返す
        
    # 上記のどの条件にも一致しない場合
    return "すみません、よく分かりません。" # デフォルトの応答

# APIエンドポイントの定義
@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    チャットメッセージを受信し、AIの応答を返すAPIエンドポイント。
    リクエストボディは ChatRequest モデルに従い、レスポンスは ChatResponse モデルに従います。
    """
    # generate_response 関数を呼び出し、ユーザーIDとメッセージを渡して応答を生成
    reply = generate_response(request.user_id, request.message)
    # 生成された応答を ChatResponse モデルに詰めて返す
    return ChatResponse(reply=reply)

# CORS (Cross-Origin Resource Sharing) ミドルウェアの設定
# フロントエンドとバックエンドが異なるオリジン（ドメインやポート）で動作する場合に必要。
# この設定は、すべてのオリジン、すべてのメソッド、すべてのヘッダーを許可する最も緩い設定です。
# 開発時には便利ですが、本番環境ではセキュリティを考慮してより厳格な設定が推奨されます。
# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
