export const demoWirelog = `{"ts":1761024000000,"t":"meta","v":1,"name":"teleported-sqlite","ticket":"wire://7f9a2b8c4e1d0a9b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3","cmd":"uvx --with 'mcp<2' mcp-server-sqlite==2025.4.25 --db-path ./app.db","policy":{"allow":"read_query,list_tables,describe_table","deny":null,"confirm":false},"redact":true,"ttlMs":180000,"maxCalls":null,"version":"1.0.0"}
{"ts":1761024001200,"t":"peer","event":"connected","fingerprint":"#a8f9...21c"}
{"ts":1761024001300,"t":"req","id":1,"method":"initialize"}
{"ts":1761024001310,"t":"res","id":1,"ok":true,"ms":10}
{"ts":1761024001400,"t":"req","id":2,"method":"tools/list"}
{"ts":1761024001420,"t":"res","id":2,"ok":true,"ms":20}
{"ts":1761024005000,"t":"req","id":3,"method":"tools/call","tool":"list_tables","argsPreview":"{}"}
{"ts":1761024005018,"t":"res","id":3,"ok":true,"ms":18,"tool":"list_tables"}
{"ts":1761024009000,"t":"req","id":4,"method":"tools/call","tool":"read_query","argsPreview":"{\\"sql\\":\\"SELECT count(*) FROM orders\\"}"}
{"ts":1761024009014,"t":"res","id":4,"ok":true,"ms":14,"tool":"read_query"}
{"ts":1761024011001,"t":"blocked","tool":"drop_table","reason":"firewall"}
{"ts":1761024011500,"t":"req","id":6,"method":"tools/call","tool":"read_query","argsPreview":"{\\"sql\\":\\"SELECT email, api_key FROM users LIMIT 5\\"}"}
{"ts":1761024011525,"t":"redacted","id":6,"count":4,"kinds":["email","openai-key","jwt","credit-card"]}
{"ts":1761024011526,"t":"res","id":6,"ok":true,"ms":26,"tool":"read_query"}
{"ts":1761024022000,"t":"req","id":7,"method":"tools/call","tool":"describe_table","argsPreview":"{\\"name\\":\\"orders\\"}"}
{"ts":1761024022012,"t":"res","id":7,"ok":true,"ms":12,"tool":"describe_table"}
{"ts":1761024028001,"t":"blocked","tool":"write_query","reason":"firewall"}
{"ts":1761024040000,"t":"peer","event":"disconnected","fingerprint":"#a8f9...21c"}
{"ts":1761024180000,"t":"end","reason":"ttl","durationMs":180000,"calls":4,"blocked":2,"redactions":4,"peers":1}`;
