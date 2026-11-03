using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

namespace Brassreel {
    static class Program {
        static HttpListener listener;
        static volatile bool running = true;
        static string distPath;
        static int activePort = 38888;
        static NotifyIcon trayIcon;
        static string browserExePath = "";
        static string profileDir = "";

        [STAThread]
        static void Main(string[] args) {
            // Ensure single-instance per user session
            bool createdNew;
            using (Mutex singleMutex = new Mutex(true, "BRASSREEL_ClockworkSiege_Singleton_Mutex", out createdNew)) {
                if (!createdNew) {
                    // Already running - re-open game URL in default browser and exit
                    try {
                        Process.Start("http://127.0.0.1:38888/");
                    } catch {}
                    return;
                }

                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);

                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                distPath = Path.Combine(baseDir, "dist");
                
                if (!Directory.Exists(distPath)) {
                    string parentDist = Path.Combine(Directory.GetParent(baseDir).FullName, "dist");
                    if (Directory.Exists(parentDist)) {
                        distPath = parentDist;
                    } else {
                        MessageBox.Show(
                            "Папка 'dist' не найдена!\nПожалуйста, убедитесь, что игра собрана.", 
                            "BRASSREEL: Ошибка запуска", 
                            MessageBoxButtons.OK, 
                            MessageBoxIcon.Error
                        );
                        return;
                    }
                }

                // 1. Bind to localhost on free port (38888-38920)
                bool serverStarted = false;
                for (int p = 38888; p <= 38920; p++) {
                    try {
                        listener = new HttpListener();
                        listener.Prefixes.Add("http://127.0.0.1:" + p + "/");
                        listener.Prefixes.Add("http://localhost:" + p + "/");
                        listener.Start();
                        activePort = p;
                        serverStarted = true;
                        break;
                    } catch {
                        if (listener != null) {
                            try { listener.Close(); } catch {}
                            listener = null;
                        }
                    }
                }

                if (!serverStarted) {
                    MessageBox.Show(
                        "Не удалось запустить локальный сервер на портах 38888-38920.",
                        "BRASSREEL: Ошибка сети",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                // Micro-server loop in dedicated background thread
                Thread serverThread = new Thread(RunServer);
                serverThread.IsBackground = true;
                serverThread.Start();

                // 2. Locate Chrome or Edge
                browserExePath = FindBrowser();

                // 3. Prepare dedicated profile directory so Chrome runs an isolated, non-delegated process
                profileDir = Path.Combine(Path.GetTempPath(), "BRASSREEL_Profile");
                try {
                    if (!Directory.Exists(profileDir)) {
                        Directory.CreateDirectory(profileDir);
                    }
                } catch {}

                // 4. Initialize System Tray Icon
                InitTrayIcon();

                // 5. Launch Game Window in standalone App Mode
                LaunchBrowserApp();

                // 6. Enter Windows Forms message loop
                Application.Run();

                // Cleanup on exit
                running = false;
                if (trayIcon != null) {
                    trayIcon.Visible = false;
                    trayIcon.Dispose();
                }
                try {
                    if (listener != null) listener.Stop();
                } catch {}
            }
        }

        static string GetGameUrl() {
            return "http://127.0.0.1:" + activePort + "/";
        }

        static void LaunchBrowserApp() {
            string url = GetGameUrl();
            Process gameProc = null;

            if (!string.IsNullOrEmpty(browserExePath) && File.Exists(browserExePath)) {
                try {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = browserExePath;
                    // Passing --user-data-dir guarantees Chrome/Edge runs an independent process that won't terminate immediately!
                    psi.Arguments = string.Format(
                        "--user-data-dir=\"{0}\" --app=\"{1}\" --window-size=1920,1080 --window-position=0,0 --no-first-run --no-default-browser-check --autoplay-policy=no-user-gesture-required",
                        profileDir, url
                    );
                    psi.UseShellExecute = false;
                    gameProc = Process.Start(psi);
                } catch {
                    try { Process.Start(url); } catch {}
                }
            } else {
                try { Process.Start(url); } catch {}
            }

            if (gameProc != null) {
                Thread monitorThread = new Thread(() => {
                    // Check if process delegates within 3 seconds
                    bool exitedQuickly = gameProc.WaitForExit(3000);
                    if (!exitedQuickly) {
                        // Independent process is running! When user closes game window, exit launcher.
                        gameProc.WaitForExit();
                        Application.Exit();
                    } else {
                        // Delegated into existing browser instance. Keep server and tray icon running!
                    }
                });
                monitorThread.IsBackground = true;
                monitorThread.Start();
            }
        }

        static string FindBrowser() {
            string[] candidates = new string[] {
                @"C:\Program Files\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"\Microsoft\Edge\Application\msedge.exe"
            };

            foreach (string c in candidates) {
                if (File.Exists(c)) {
                    return c;
                }
            }
            return "";
        }

        static void InitTrayIcon() {
            try {
                Icon icon = null;
                try {
                    using (Bitmap bmp = new Bitmap(32, 32)) {
                        using (Graphics g = Graphics.FromImage(bmp)) {
                            g.SmoothingMode = SmoothingMode.AntiAlias;
                            g.Clear(Color.Transparent);
                            // Brass gear base
                            using (Brush b = new SolidBrush(Color.FromArgb(28, 20, 14))) {
                                g.FillEllipse(b, 2, 2, 28, 28);
                            }
                            using (Pen p = new Pen(Color.FromArgb(235, 175, 45), 3f)) {
                                g.DrawEllipse(p, 4, 4, 24, 24);
                                g.DrawLine(p, 16, 2, 16, 30);
                                g.DrawLine(p, 2, 16, 30, 16);
                                g.DrawLine(p, 6, 6, 26, 26);
                                g.DrawLine(p, 6, 26, 26, 6);
                            }
                            using (Brush b2 = new SolidBrush(Color.FromArgb(235, 175, 45))) {
                                g.FillEllipse(b2, 12, 12, 8, 8);
                            }
                        }
                        icon = Icon.FromHandle(bmp.GetHicon());
                    }
                } catch {
                    icon = SystemIcons.Application;
                }

                ContextMenu menu = new ContextMenu();
                
                MenuItem titleItem = new MenuItem("BRASSREEL: Clockwork Siege");
                titleItem.Enabled = false;
                menu.MenuItems.Add(titleItem);
                menu.MenuItems.Add("-");

                menu.MenuItems.Add("Открыть в браузере (" + GetGameUrl() + ")", (s, e) => {
                    try { Process.Start(GetGameUrl()); } catch {}
                });

                menu.MenuItems.Add("Перезапустить окно игры", (s, e) => {
                    LaunchBrowserApp();
                });

                menu.MenuItems.Add("-");

                menu.MenuItems.Add("Завершить игру (Выход)", (s, e) => {
                    Application.Exit();
                });

                trayIcon = new NotifyIcon();
                trayIcon.Icon = icon;
                trayIcon.Text = "BRASSREEL: Clockwork Siege";
                trayIcon.ContextMenu = menu;
                trayIcon.Visible = true;
                trayIcon.DoubleClick += (s, e) => {
                    try { Process.Start(GetGameUrl()); } catch {}
                };
            } catch {}
        }

        static void RunServer() {
            while (running) {
                try {
                    var context = listener.GetContext();
                    ThreadPool.QueueUserWorkItem((ctxObj) => {
                        var ctx = (HttpListenerContext)ctxObj;
                        try {
                            string rawPath = ctx.Request.Url.AbsolutePath.TrimStart('/');
                            rawPath = Uri.UnescapeDataString(rawPath);
                            if (string.IsNullOrEmpty(rawPath)) rawPath = "index.html";

                            string filePath = Path.Combine(distPath, rawPath.Replace('/', Path.DirectorySeparatorChar));
                            if (File.Exists(filePath)) {
                                byte[] bytes = File.ReadAllBytes(filePath);
                                string ext = Path.GetExtension(filePath).ToLower();
                                string mime = "application/octet-stream";
                                switch (ext) {
                                    case ".html": mime = "text/html; charset=utf-8"; break;
                                    case ".js": mime = "application/javascript; charset=utf-8"; break;
                                    case ".css": mime = "text/css; charset=utf-8"; break;
                                    case ".json": mime = "application/json; charset=utf-8"; break;
                                    case ".png": mime = "image/png"; break;
                                    case ".jpg":
                                    case ".jpeg": mime = "image/jpeg"; break;
                                    case ".svg": mime = "image/svg+xml"; break;
                                    case ".ico": mime = "image/x-icon"; break;
                                    case ".woff2": mime = "font/woff2"; break;
                                    case ".woff": mime = "font/woff"; break;
                                    case ".ttf": mime = "font/ttf"; break;
                                    case ".mp3": mime = "audio/mpeg"; break;
                                    case ".ogg": mime = "audio/ogg"; break;
                                    case ".wav": mime = "audio/wav"; break;
                                    case ".wasm": mime = "application/wasm"; break;
                                }

                                ctx.Response.ContentType = mime;
                                ctx.Response.ContentLength64 = bytes.Length;
                                ctx.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                                ctx.Response.OutputStream.Write(bytes, 0, bytes.Length);
                            } else {
                                ctx.Response.StatusCode = 404;
                            }
                        } catch {} finally {
                            try { ctx.Response.OutputStream.Close(); } catch {}
                        }
                    }, context);
                } catch {
                    if (!running) break;
                }
            }
        }
    }
}
