use rusqlite::Connection;
use tauri::{path::BaseDirectory, Manager};

// データベースファイル名
pub const BSKY_DB: &str = "bsky.db";

pub fn init(db_path: &str) -> Result<(), String> {
    create_user_table(db_path)?;
    create_post_table(db_path)?;
    Ok(())
}

// ユーザーテーブル作成
fn create_user_table(db_path: &str) -> Result<String, String> {
    let connection = Connection::open(db_path).map_err(|e| e.to_string())?;
    // connection.execute("DROP TABLE IF EXISTS users;", []).unwrap();
    let query = "
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            username TEXT NOT NULL UNIQUE,
            api TEXT NOT NULL
            );
        ";

    connection.execute(query, []).map_err(|e| e.to_string())?;
    Ok("user table created".to_string())
}

fn create_post_table(db_path: &str) -> Result<String, String> {
    let connection = Connection::open(db_path).map_err(|e| e.to_string())?;
    let query = "
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            post TEXT NOT NULL,
            created_at TEXT NOT NULL,
            username_id INTEGER NOT NULL,
            FOREIGN KEY (username_id) REFERENCES users(id) ON DELETE CASCADE
            );
        ";
    
    connection.execute(query, []).map_err(|e| e.to_string())?;
    Ok("post table created".to_string())
}

#[tauri::command]
pub async fn signup_user(app_handle: tauri::AppHandle, username: String, api: String) -> Result<String, String> {
    // let app_dir = app_handle.path().app_data_dir().unwrap();
    let app_dir = app_handle.path().resolve(".", BaseDirectory::Config).map_err(|e| format!("Failed to resolve app directory: {}", e))?;
    
    let db_path = app_dir.join(BSKY_DB);

    let connection = Connection::open(&db_path).map_err(|e| e.to_string())?;

    // 重複チェック
    let count: i64 = connection.query_row(
        "SELECT COUNT(*) FROM users WHERE username = ?",
        [&username],
        |row| row.get(0),
        ).unwrap_or(0);

    if count > 0 {
        return Err(format!("同じユーザー名が既に存在します。データベースパス:{}", db_path.display()));
    }

    // ユーザー登録
    connection.execute("
        INSERT INTO users (username, api) VALUES (?, ?)",[&username, &api]).map_err(|e| e.to_string())?;

        Ok("ユーザー登録完了".to_string())
}

#[tauri::command]
pub async fn login_user(app_handle: tauri::AppHandle, username: String) -> Result<String, String> {
    // let app_dir = app_handle.path().app_data_dir().unwrap();
    let app_dir = app_handle.path().resolve(".", BaseDirectory::Config).map_err(|e| format!("Failed to resolve app directory: {}", e))?;
    
    let db_path = app_dir.join(BSKY_DB);

    let connection = Connection::open(&db_path).map_err(|e| e.to_string())?;

    // 登録があるかチェック
    let count : i64 = connection.query_row(
        "SELECT COUNT(*) FROM users WHERE username = ?",
        [&username],
        |row| row.get(0),
        ).unwrap_or(0);
    
    if count == 0 {
        return Err(format!("まだユーザー登録されていません。データベース：{}", db_path.display()));
    }

    // ユーザー名からapiを取得
    let api: String = connection.query_row(
        "SELECT api FROM users WHERE username = ?",
        [&username],
        |row| row.get(0)
    ).unwrap_or("パスワードなし".to_string());

    Ok(api)
}

#[tauri::command]
pub async fn get_users(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    // let app_dir = app_handle.path().app_data_dir().unwrap();
    let app_dir = app_handle.path().resolve(".", BaseDirectory::Config).map_err(|e| format!("Failed to resolve app directory: {}", e))?;
    
    let db_path = app_dir.join(BSKY_DB);

    let connection = Connection::open(&db_path).map_err(|e| e.to_string())?;

    // ユーザー一覧取得
    let mut stmt = connection.prepare("SELECT username FROM users").map_err(|e| e.to_string())?;
    let users = stmt.query_map([], |row| row.get(0)).map_err(|e| e.to_string())?
    .collect::<Result<Vec<String>, _>>().map_err(|e| e.to_string())?;

    Ok(users)
}
