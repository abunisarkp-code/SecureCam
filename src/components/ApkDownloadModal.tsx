import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  Terminal,
  Layers,
  Copy,
  Check,
  X,
  AlertTriangle,
  Globe,
  Github,
  HelpCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCodeExplorer?: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({
  isOpen,
  onClose,
  onOpenCodeExplorer,
}) => {
  const [activeTab, setActiveTab] = useState<'no-build' | 'build-guide' | 'troubleshoot'>('no-build');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Get SecureCam on Your Phone</h3>
                <span className="text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded">
                  Android & iOS Ready
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Run instantly in mobile browser or compile native Android APK
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-6 pt-2">
          <button
            onClick={() => setActiveTab('no-build')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'no-build'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Option 1: Use Instantly (No Build Needed!)</span>
          </button>
          <button
            onClick={() => setActiveTab('build-guide')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'build-guide'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Option 2: Build Android APK</span>
          </button>
          <button
            onClick={() => setActiveTab('troubleshoot')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'troubleshoot'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Fix Build Errors</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* TAB 1: NO BUILD NEEDED */}
          {activeTab === 'no-build' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      You Don't Need Android Studio or Gradle to Use SecureCam!
                    </h4>
                    <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                      This web application is already fully built and operational right now. You can turn any old Android phone into a camera or monitor in 30 seconds:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-900/60 text-emerald-400 text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <div className="font-semibold text-xs text-white">Open on Your Phone</div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Open this web URL in <strong>Google Chrome</strong> (Android) or <strong>Safari</strong> (iPhone).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-900/60 text-emerald-400 text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <div className="font-semibold text-xs text-white">Install / Add to Home</div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Tap the browser menu (<strong>⋮</strong>) and select <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-900/60 text-emerald-400 text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <div className="font-semibold text-xs text-white">Start Camera or Monitor</div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Launch it from your home screen. Full camera access, motion detection, and intercom work out of the box!
                    </p>
                  </div>
                </div>

                {/* Share URL */}
                <div className="p-3 rounded-xl bg-black/40 border border-neutral-800 flex items-center justify-between gap-3">
                  <div className="truncate text-xs text-neutral-300 font-mono">
                    {currentUrl || 'https://...'}
                  </div>
                  <button
                    onClick={() => copyToClipboard(currentUrl, 'url')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shrink-0"
                  >
                    {copiedCmd === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCmd === 'url' ? 'Copied URL!' : 'Copy Phone Link'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300">
                <span>Want to build the compiled native <code>.apk</code> file instead?</span>
                <button
                  onClick={() => setActiveTab('build-guide')}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  <span>See APK Build Options</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: BUILD GUIDE */}
          {activeTab === 'build-guide' && (
            <div className="space-y-5">
              {/* Direct Download Card */}
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                      Full Source Code Included
                    </span>
                    <h4 className="text-base font-bold text-white">
                      Download SecureCam Android Studio Package
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1 max-w-lg leading-relaxed">
                      Contains the full Android Kotlin source code, CameraX video pipelines, WebRTC integration, Gradle wrapper (<code className="text-neutral-300">gradlew</code>), and GitHub Actions auto-build workflow.
                    </p>
                  </div>
                  <a
                    href="/SecureCam-Android-Project.tar.gz"
                    download="SecureCam-Android-Project.tar.gz"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Project (.tar.gz)</span>
                  </a>
                </div>
              </div>

              {/* 3 Ways to Build */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Choose How You Want to Build:
                </h5>

                {/* Cloud Build via GitHub Actions */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-white" />
                    <span className="font-semibold text-neutral-200 text-xs">
                      Method A: Cloud Build with GitHub Actions (No Android Studio or Java Needed!)
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    The downloaded package includes a pre-configured <code className="text-neutral-300">.github/workflows/build-apk.yml</code>. If you don't have Android development tools installed:
                  </p>
                  <ol className="list-decimal list-inside text-[11px] text-neutral-300 space-y-1 pl-1">
                    <li>Create a repository on <strong>GitHub</strong> and push the project files.</li>
                    <li>Go to the <strong>Actions</strong> tab on your repository.</li>
                    <li>GitHub automatically builds the APK in the cloud and gives you a downloadable <code className="text-emerald-400 font-mono">SecureCam-Debug-APK</code> artifact!</li>
                  </ol>
                </div>

                {/* Android Studio */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-neutral-200 text-xs">
                      Method B: Open in Android Studio (Recommended for Developers)
                    </span>
                  </div>
                  <ol className="list-decimal list-inside text-[11px] text-neutral-300 space-y-1 pl-1">
                    <li>Extract <code className="text-neutral-200">SecureCam-Android-Project.tar.gz</code>.</li>
                    <li>Open <strong>Android Studio</strong> and select <strong>File &gt; Open...</strong>, choosing the extracted <code className="text-neutral-200">android/</code> directory.</li>
                    <li>Wait for Gradle sync. Android Studio will configure JDK and SDK automatically.</li>
                    <li>Click <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.</li>
                    <li>Click <strong>locate</strong> in the notification popup to get <code className="text-emerald-400 font-mono">app-debug.apk</code>.</li>
                  </ol>
                </div>

                {/* CLI */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-neutral-200 text-xs">
                        Method C: Command Line with Gradle Wrapper
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          'tar -xzf SecureCam-Android-Project.tar.gz\ncd android\n./gradlew assembleDebug',
                          'cli'
                        )
                      }
                      className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-neutral-800 px-2 py-1 rounded"
                    >
                      {copiedCmd === 'cli' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === 'cli' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded bg-black/70 text-emerald-400 font-mono overflow-x-auto text-[11px]">
                    tar -xzf SecureCam-Android-Project.tar.gz{'\n'}cd android{'\n'}./gradlew assembleDebug
                  </pre>
                  <p className="text-[11px] text-neutral-400">
                    On Windows: run <code className="text-neutral-300">gradlew.bat assembleDebug</code>. (Requires JDK 17 and Android SDK installed).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TROUBLESHOOTING */}
          {activeTab === 'troubleshoot' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-white mb-1">Encountered an error while compiling?</div>
                  <p className="text-neutral-300 leading-relaxed">
                    Android compilation requires specific toolchains (Java 17, Android SDK 35, Gradle). Here are the exact fixes for the most common errors:
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="font-semibold text-emerald-400">
                    1. "./gradlew: No such file or directory"
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    <strong>Cause:</strong> You may have downloaded an earlier archive without the Gradle wrapper script.
                  </p>
                  <p className="text-neutral-400 leading-relaxed">
                    <strong>Fix:</strong> Re-download the project from Option 2. The package now includes <code className="text-neutral-200 font-mono">gradlew</code>, <code className="text-neutral-200 font-mono">gradlew.bat</code>, and <code className="text-neutral-200 font-mono">gradle-wrapper.properties</code>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="font-semibold text-emerald-400">
                    2. "SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable"
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    <strong>Cause:</strong> Gradle doesn't know where your Android SDK is installed on your computer.
                  </p>
                  <p className="text-neutral-400 leading-relaxed">
                    <strong>Fix:</strong> Create a file named <code className="text-neutral-200 font-mono">local.properties</code> in the <code className="text-neutral-200 font-mono">android/</code> directory containing:
                  </p>
                  <div className="p-2 rounded bg-black/60 font-mono text-[11px] text-neutral-300 space-y-0.5">
                    <div># Windows:</div>
                    <div>sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk</div>
                    <div className="pt-1"># macOS:</div>
                    <div>sdk.dir=/Users/YourUsername/Library/Android/sdk</div>
                  </div>
                  <p className="text-neutral-400 text-[11px]">
                    <em>Or simply open the project in Android Studio, which configures this automatically.</em>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="font-semibold text-emerald-400">
                    3. "JAVA_HOME is not set" or "Unsupported class file major version"
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    <strong>Cause:</strong> Android Gradle Plugin 8.8 requires <strong>Java 17</strong>. Older Java 8/11 or very new Java 23 may fail.
                  </p>
                  <p className="text-neutral-400 leading-relaxed">
                    <strong>Fix:</strong> Install JDK 17 (e.g. from <a href="https://adoptium.net" target="_blank" rel="noreferrer" className="text-emerald-400 underline">adoptium.net</a>) and set <code className="text-neutral-200 font-mono">export JAVA_HOME=/path/to/jdk-17</code>, or select JDK 17 inside Android Studio's <strong>Settings &gt; Build Tools &gt; Gradle &gt; Gradle JDK</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="font-semibold text-emerald-400">
                    4. Don't want to install Android Studio or SDK tools?
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    Use <strong>Option 1 (Use Instantly)</strong> to run SecureCam directly in mobile Chrome on your phone, or use <strong>GitHub Actions</strong> to let GitHub build the APK for you in the cloud for free!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          {onOpenCodeExplorer ? (
            <button
              onClick={() => {
                onClose();
                onOpenCodeExplorer();
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
            >
              Browse Android Kotlin & XML Source Code
            </button>
          ) : (
            <span className="text-xs text-neutral-500">SecureCam Android Package</span>
          )}
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
