use rusqlite::Connection;
use tauri::Manager;

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
    let query = "
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            username TEXT NOT NULL UNIQUE,
            app_pass TEXT NOT NULL
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
            FOREIGN KEY (username_id) REFERANCES users(id) ON DELETE CASCADE
            );
        ";
    
    connection.execute(query, []).map_err(|e| e.to_string())?;
    Ok("post table created".to_string())
}

#[tauri::command]
pub async fn signup_user(app_handle: tauri::AppHandle, username: String, app_pass: String) -> Result<String, String> {
    let app_dir = app_handle.path().app_data_dir().unwrap();
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
        INSERT INTO users (username, app_pass) VALUES (?, ?)",[&username, &app_pass]).map_err(|e| e.to_string())?;

        Ok("ユーザー登録完了".to_string())
}

#[tauri::command]
pub async fn login_user(app_handle: tauri::AppHandle, username: String) -> Result<String, String> {
    let app_dir = app_handle.path().app_data_dir().unwrap();
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

    // ユーザー名からapp_passを取得
    let app_pass: String = connection.query_row(
        "SELECT app_pass FROM users WHERE username = ?",
        [&username],
        |row| row.get(0)
    ).unwrap_or("パスワードなし".to_string());

    Ok(app_pass)
}
