# バックエンド (FastAPI) 詳細

## 1. 概要

このバックエンドアプリケーションは、PythonのWebフレームワークであるFastAPIを使用して構築されています。主な役割は以下の通りです。

*   チャットメッセージを受け取り、AIによる応答を生成するAPI (`/api/chat`) を提供します。
*   ユーザーごとの会話の文脈（コンテキスト）をサーバー側で簡易的に記憶・管理し、応答生成に活用します。

## 2. `/api/chat` エンドポイント仕様

このエンドポイントは、ユーザーからのチャットメッセージを処理し、AIの応答を返します。

*   **URL**: `/api/chat`
*   **HTTPメソッド**: `POST`
*   **リクエスト形式**: JSON
    ```json
    {
      "user_id": "string",  // ユーザーを識別するための一意のID
      "message": "string"   // ユーザーが送信したメッセージ
    }
    ```
*   **レスポンス形式**: JSON
    ```json
    {
      "reply": "string"     // AIによって生成された応答メッセージ
    }
    ```

### コンテキスト管理について

*   サーバーは、リクエストで送られてくる `user_id` ごとに会話の履歴をメモリ上に保存します。
*   新しいメッセージが届くと、そのユーザーの過去のメッセージ履歴を参照し、文脈に合わせた応答（例: ユーザーの名前を記憶して呼びかけるなど）を試みます。
*   現在の実装では、サーバーが再起動すると会話履歴は失われます。これはデモンストレーションのためのシンプルな実装です。

## 3. 主要ファイルとその役割

*   `app/main.py`:
    *   FastAPIアプリケーションのメインファイルです。
    *   `/api/chat` エンドポイントの定義と処理ロジックが含まれています。
    *   ユーザーごとの会話履歴（コンテキスト）を管理する辞書 (`conversation_history`) を保持しています。
    *   受け取ったメッセージと会話履歴に基づいて応答を生成する簡易的なAIロジック (`generate_response` 関数) が実装されています。
*   `pyproject.toml`:
    *   Poetryを使用してプロジェクトの依存関係（FastAPI、Uvicornなど）とメタデータを管理します。
*   `poetry.lock`:
    *   Poetryによって生成されるファイルで、依存関係の正確なバージョンをロックします。

## 4. セットアップと実行方法

1.  **依存関係のインストール**:
    プロジェクトのルートディレクトリ（この `README.md` があるディレクトリ）で以下のコマンドを実行し、必要なライブラリをインストールします。
    ```bash
    poetry install
    ```
    *Poetryがインストールされていない場合は、[公式ドキュメント](https://python-poetry.org/docs/#installation)に従ってインストールしてください。*

2.  **開発サーバーの起動**:
    以下のコマンドで、Uvicorn開発サーバーを起動します。
    ```bash
    poetry run uvicorn app.main:app --reload --port 8000
    ```
    *   `--reload`: コードが変更された際にサーバーを自動的に再起動します。
    *   `--port 8000`: サーバーをポート `8000` で起動します。

    サーバーが起動すると、`http://localhost:8000` でアクセス可能になります。`/healthz` エンドポイント (`http://localhost:8000/healthz`) にアクセスして、サーバーが正常に動作しているかを確認できます。

## 5. 技術スタック

*   **フレームワーク**: FastAPI
*   **Webサーバー**: Uvicorn
*   **パッケージ管理**: Poetry
