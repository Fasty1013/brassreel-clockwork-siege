using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

namespace Brassreel {
    class Program {
        static HttpListener listener;
        static bool running = true;
        static string distPath;

        [STAThread]
        static void Main(string[] args) {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            distPath = Path.Combine(baseDir, "dist");
            
            if (!Directory.Exists(distPath)) {
                // If running from launcher subfolder or root
                string parentDist = Path.Combine(Directory.GetParent(baseDir).FullName, "dist");
                if (Directory.Exists(parentDist)) {
                    distPath = parentDist;
                } else {
                    MessageBox.Show("Папка 'dist' не найдена! Пожалуйста, сначала соберите проект: npm run build", "BRASSREEL: Ошибка запуска", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }
            }

            // 1. Local port
            int port = 38888;
            string url = "http://localhost:" + port + "/";

            // 2. Start embedded micro-server
            Thread serverThread = new Thread(() => RunServer(port));
            serverThread.IsBackground = true;
            serverThread.Start();

            Thread.Sleep(120);

            // 3. Find Chrome or Edge for standalone App Mode (borderless, no URL bar)
            string browserPath = "";
            string[] candidates = new string[] {
                @"C:\Program Files\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
            };

            foreach (string c in candidates) {
                if (File.Exists(c)) {
                    browserPath = c;
                    break;
                }
            }

            Process gameProc = null;
            if (!string.IsNullOrEmpty(browserPath)) {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = browserPath;
                psi.Arguments = "--app=\"" + url + "\" --window-size=1920,1080 --window-position=0,0 --autoplay-policy=no-user-gesture-required";
                psi.UseShellExecute = false;
                gameProc = Process.Start(psi);
            } else {
                Process.Start(url);
            }

            if (gameProc != null) {
                gameProc.WaitForExit();
            }

            running = false;
            try { if (listener != null) listener.Stop(); } catch {}
        }

        static void RunServer(int port) {
            try {
                listener = new HttpListener();
                listener.Prefixes.Add("http://localhost:" + port + "/");
                listener.Start();

                while (running) {
                    var context = listener.GetContext();
                    ThreadPool.QueueUserWorkItem((ctxObj) => {
                        var ctx = (HttpListenerContext)ctxObj;
                        try {
                            string rawPath = ctx.Request.Url.AbsolutePath.TrimStart('/');
                            if (string.IsNullOrEmpty(rawPath)) rawPath = "index.html";

                            string filePath = Path.Combine(distPath, rawPath.Replace('/', Path.DirectorySeparatorChar));
                            if (File.Exists(filePath)) {
                                byte[] bytes = File.ReadAllBytes(filePath);
                                string ext = Path.GetExtension(filePath).ToLower();
                                string mime = "application/octet-stream";
                                if (ext == ".html") mime = "text/html; charset=utf-8";
                                else if (ext == ".js") mime = "application/javascript; charset=utf-8";
                                else if (ext == ".css") mime = "text/css; charset=utf-8";
                                else if (ext == ".json") mime = "application/json; charset=utf-8";
                                else if (ext == ".png") mime = "image/png";
                                else if (ext == ".svg") mime = "image/svg+xml";

                                ctx.Response.ContentType = mime;
                                ctx.Response.ContentLength64 = bytes.Length;
                                ctx.Response.OutputStream.Write(bytes, 0, bytes.Length);
                            } else {
                                ctx.Response.StatusCode = 404;
                            }
                        } catch {} finally {
                            try { ctx.Response.OutputStream.Close(); } catch {}
                        }
                    }, context);
                }
            } catch {}
        }
    }
}
