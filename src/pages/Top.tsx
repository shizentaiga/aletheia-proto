/** @jsxImportSource hono/jsx */

/**
 * 1. 型定義
 * 認証済みのユーザー情報をPropsとして受け取れるようにします。
 */
interface TopProps {
  user?: {
    display_name: string | null
    email: string | null
  } | null
}

/**
 * 2. トップページコンポーネント
 */
export const Top = ({ user }: TopProps) => {
  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>メインポータル</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        情報の「種」から「資産」へ。現在はプロトタイプ稼働中です。
      </p>

      {/* 認証状態に応じたカード表示 */}
      <div style={{
        border: '1px solid #ddd',
        padding: '25px',
        borderRadius: '10px',
        background: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        textAlign: 'center'
      }}>
        {user ? (
          <div>
            <p style={{ color: '#2b9348', fontWeight: 'bold', fontSize: '1.1rem' }}>
              ✅ ログイン中: {user.display_name}
            </p>
            <p style={{ fontSize: '0.85rem', color: '#888', margin: '8px 0 20px' }}>
              Email: {user.email}
            </p>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <a href="/logout" style={{
                padding: '8px 16px',
                border: '1px solid #666',
                color: '#666',
                textDecoration: 'none',
                borderRadius: '5px',
                fontSize: '0.9rem'
              }}>
                ログアウト
              </a>
              <button 
                onclick="if(confirm('本当に退会しますか？\nこの操作は取り消せません。')){ location.href='/delete-account'; }"
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d90429',
                  color: '#d90429',
                  background: 'transparent',
                  borderRadius: '5px',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}>
                退会する
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ color: '#666', marginBottom: '20px' }}>現在は【未ログイン】です</p>
            <a href="/auth/google" style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#4285F4',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold'
            }}>
              Googleでサインイン
            </a>
          </div>
        )}
      </div>

      {/* 今後の展望セクション */}
      <div style={{ 
        marginTop: '30px',
        padding: '15px', 
        borderRadius: '8px', 
        background: '#f8f9fa',
        fontSize: '0.9rem',
        color: '#555'
      }}>
        <p>📡 次のステップ：Cloudflare Edge Locationからの地域取得</p>
      </div>
    </div>
  )
}