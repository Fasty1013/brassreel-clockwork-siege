using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace Brassreel {
    static class Program {
        static TcpListener tcpListener;
        static volatile bool running = true;
        static string distPath;
        static int activePort = 38888;
        static NotifyIcon trayIcon;
        static string browserExePath = "";
        static string profileDir = "";
        static string portFilePath = "";
        static string logFilePath = "";

        static void Log(string msg) {
            try {
                string line = "[" + DateTime.Now.ToString("HH:mm:ss.fff") + "] " + msg + "\r\n";
                File.AppendAllText(logFilePath, line);
                Console.WriteLine(line);
            } catch {}
        }

        [STAThread]
        static void Main(string[] args) {
            logFilePath = Path.Combine(Path.GetTempPath(), "BRASSREEL_log.txt");
            Log("==========================================");
            Log("=== BRASSREEL Launcher Starting ===");

            AppDomain.CurrentDomain.UnhandledException += (s, e) => {
                Log("FATAL AppDomain.UnhandledException: " + e.ExceptionObject);
            };
            Application.ThreadException += (s, e) => {
                Log("FATAL Application.ThreadException: " + e.Exception);
            };

            portFilePath = Path.Combine(Path.GetTempPath(), "BRASSREEL_port.txt");

            // 1. Single-instance mutex check
            bool createdNew;
            Mutex singleMutex = null;
            try {
                singleMutex = new Mutex(true, "BRASSREEL_ClockworkSiege_Singleton_Mutex", out createdNew);
            } catch (Exception ex) {
                Log("Mutex exception: " + ex.Message);
                createdNew = true;
            }

            if (!createdNew) {
                Log("Existing instance detected. Re-opening game in browser...");
                int targetPort = 38888;
                try {
                    if (File.Exists(portFilePath)) {
                        string pStr = File.ReadAllText(portFilePath).Trim();
                        int parsed;
                        if (int.TryParse(pStr, out parsed) && parsed > 0) targetPort = parsed;
                    }
                } catch {}

                string u = "http://127.0.0.1:" + targetPort + "/";
                try { Process.Start(u); } catch {}
                return;
            }

            try {
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);

                // Locate dist folder
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                distPath = Path.Combine(baseDir, "dist");
                if (!Directory.Exists(distPath) || !File.Exists(Path.Combine(distPath, "index.html"))) {
                    string parentDist = Path.Combine(Directory.GetParent(baseDir).FullName, "dist");
                    if (Directory.Exists(parentDist) && File.Exists(Path.Combine(parentDist, "index.html"))) {
                        distPath = parentDist;
                    } else {
                        MessageBox.Show(
                            "Папка 'dist' не найдена! Сначала соберите проект командой: npm run build", 
                            "BRASSREEL: Ошибка", 
                            MessageBoxButtons.OK, 
                            MessageBoxIcon.Error
                        );
                        return;
                    }
                }
                Log("Serving assets from: " + distPath);

                // 2. Start bulletproof TcpListener on 127.0.0.1 (Zero admin rights, zero HTTP.sys URL reservation issues)
                bool serverBound = false;
                for (int p = 38888; p <= 38920; p++) {
                    try {
                        tcpListener = new TcpListener(IPAddress.Loopback, p);
                        tcpListener.Start();
                        activePort = p;
                        serverBound = true;
                        Log("TcpListener successfully bound and listening on 127.0.0.1:" + p);
                        try { File.WriteAllText(portFilePath, p.ToString()); } catch {}
                        break;
                    } catch (Exception ex) {
                        Log("Port " + p + " bind failed: " + ex.Message);
                        if (tcpListener != null) {
                            try { tcpListener.Stop(); } catch {}
                            tcpListener = null;
                        }
                    }
                }

                if (!serverBound) {
                    MessageBox.Show(
                        "Не удалось привязать сетевой порт 38888-38920.", 
                        "BRASSREEL: Сетевая ошибка", 
                        MessageBoxButtons.OK, 
                        MessageBoxIcon.Error
                    );
                    return;
                }

                // Dedicated server thread
                Thread serverThread = new Thread(RunTcpServer);
                serverThread.IsBackground = true;
                serverThread.Name = "BrassreelTcpServer";
                serverThread.Start();

                // 3. Locate Chrome / Edge / Brave
                browserExePath = FindBrowser();
                Log("Browser detected: " + (string.IsNullOrEmpty(browserExePath) ? "None (system default)" : browserExePath));

                // 4. Dedicated profile for Chrome app mode
                profileDir = Path.Combine(Path.GetTempPath(), "BRASSREEL_Profile");
                try {
                    if (!Directory.Exists(profileDir)) Directory.CreateDirectory(profileDir);
                } catch {}

                // 5. System tray icon
                InitTrayIcon();

                // 6. Launch Game Window
                LaunchBrowserApp();

                // 7. Keep message loop running
                Log("Entering WinForms message loop...");
                Application.Run();
                Log("WinForms message loop finished.");
            } catch (Exception ex) {
                Log("Fatal exception in Main: " + ex);
            } finally {
                running = false;
                try { if (File.Exists(portFilePath)) File.Delete(portFilePath); } catch {}
                if (trayIcon != null) {
                    try { trayIcon.Visible = false; trayIcon.Dispose(); } catch {}
                }
                if (tcpListener != null) {
                    try { tcpListener.Stop(); } catch {}
                }
                if (singleMutex != null) {
                    try { singleMutex.ReleaseMutex(); singleMutex.Dispose(); } catch {}
                }
                Log("=== Launcher cleanly exited ===");
            }
        }

        static string GetGameUrl() {
            return "http://127.0.0.1:" + activePort + "/";
        }

        static void LaunchBrowserApp() {
            string url = GetGameUrl();
            Log("Launching game at: " + url);

            if (!string.IsNullOrEmpty(browserExePath) && File.Exists(browserExePath)) {
                try {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = browserExePath;
                    psi.Arguments = string.Format(
                        "--user-data-dir=\"{0}\" --app=\"{1}\" --window-size=1280,750 --window-position=center --no-first-run --no-default-browser-check --autoplay-policy=no-user-gesture-required",
                        profileDir, url
                    );
                    psi.UseShellExecute = false;
                    Process p = Process.Start(psi);
                    if (p != null) Log("Launched browser process PID=" + p.Id);
                    return;
                } catch (Exception ex) {
                    Log("Browser launch error: " + ex.Message);
                }
            }

            try { Process.Start(url); } catch {}
        }

        static string FindBrowser() {
            string[] candidates = new string[] {
                @"C:\Program Files\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"\BraveSoftware\Brave-Browser\Application\brave.exe"
            };

            foreach (string c in candidates) {
                if (File.Exists(c)) return c;
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
                MenuItem titleItem = new MenuItem("BRASSREEL: Clockwork Siege (Порт: " + activePort + ")");
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

                menu.MenuItems.Add("Закрыть игру (выход)", (s, e) => {
                    Log("User clicked Exit in tray menu.");
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
            } catch (Exception ex) {
                Log("InitTrayIcon error: " + ex.Message);
            }
        }

        static void RunTcpServer() {
            Log("RunTcpServer thread active.");
            while (running) {
                try {
                    TcpClient client = tcpListener.AcceptTcpClient();
                    ThreadPool.QueueUserWorkItem(HandleClient, client);
                } catch {
                    if (!running) break;
                }
            }
            Log("RunTcpServer thread finished.");
        }

        static void HandleClient(object clientObj) {
            TcpClient client = (TcpClient)clientObj;
            try {
                using (NetworkStream ns = client.GetStream()) {
                    ns.ReadTimeout = 5000;
                    ns.WriteTimeout = 5000;

                    byte[] reqBuffer = new byte[8192];
                    int bytesRead = ns.Read(reqBuffer, 0, reqBuffer.Length);
                    if (bytesRead <= 0) return;

                    string reqText = Encoding.ASCII.GetString(reqBuffer, 0, bytesRead);
                    string[] lines = reqText.Split(new string[] { "\r\n" }, StringSplitOptions.None);
                    if (lines.Length == 0) return;

                    string reqLine = lines[0];
                    string[] parts = reqLine.Split(' ');
                    if (parts.Length < 2) return;

                    string method = parts[0];
                    string rawPath = parts[1];

                    // Remove query string
                    int qIdx = rawPath.IndexOf('?');
                    if (qIdx >= 0) rawPath = rawPath.Substring(0, qIdx);
                    rawPath = rawPath.TrimStart('/');
                    rawPath = Uri.UnescapeDataString(rawPath);
                    if (string.IsNullOrEmpty(rawPath)) rawPath = "index.html";

                    string filePath = Path.Combine(distPath, rawPath.Replace('/', Path.DirectorySeparatorChar));

                    if (File.Exists(filePath)) {
                        string ext = Path.GetExtension(filePath).ToLowerInvariant();
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

                        FileInfo fi = new FileInfo(filePath);
                        long fileLength = fi.Length;

                        string headers = string.Format(
                            "HTTP/1.1 200 OK\r\n" +
                            "Content-Type: {0}\r\n" +
                            "Content-Length: {1}\r\n" +
                            "Access-Control-Allow-Origin: *\r\n" +
                            "Cache-Control: no-cache\r\n" +
                            "Connection: close\r\n\r\n",
                            mime, fileLength
                        );

                        byte[] headerBytes = Encoding.ASCII.GetBytes(headers);
                        ns.Write(headerBytes, 0, headerBytes.Length);

                        if (method != "HEAD") {
                            using (FileStream fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read)) {
                                byte[] fileBuf = new byte[65536];
                                int read;
                                while ((read = fs.Read(fileBuf, 0, fileBuf.Length)) > 0) {
                                    ns.Write(fileBuf, 0, read);
                                }
                            }
                        }
                    } else {
                        string notFound = "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\nContent-Length: 9\r\nConnection: close\r\n\r\nNot Found";
                        byte[] notFoundBytes = Encoding.ASCII.GetBytes(notFound);
                        ns.Write(notFoundBytes, 0, notFoundBytes.Length);
                    }
                    ns.Flush();
                }
            } catch {
            } finally {
                try { client.Close(); } catch {}
            }
        }
    }
}
