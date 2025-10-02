import './App.css';
import { useState, useRef, useEffect } from 'react';
import { Send, Mail, CheckCircle, XCircle, Loader, Users, Trash2, Copy, Code, FileText, Eye, Zap, Sparkles, Star } from 'lucide-react';

export default function App() {
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [emailType, setEmailType] = useState('text');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const extractEmails = (text) => {
    const emails = text
      .replace(/[\n\r]+/g, ',')
      .replace(/[;\s]+/g, ',')
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0 && emailRegex.test(email));

    return [...new Set(emails)];
  };

  const handlePaste = (e) => {
    // Don't prevent default on mobile to ensure paste works
    const pastedText = e.clipboardData?.getData('text') || '';

    if (pastedText) {
      e.preventDefault();
      const extractedEmails = extractEmails(pastedText);

      if (extractedEmails.length > 0) {
        setSelectedEmails(prev => {
          const combined = [...prev, ...extractedEmails];
          return [...new Set(combined)];
        });
        setRecipients('');
      } else {
        setRecipients(pastedText);
      }
    }
  };

  useEffect(() => {
    if (recipients.trim() && (recipients.includes(',') || recipients.includes(' ') || recipients.includes('\n'))) {
      const extractedEmails = extractEmails(recipients);
      if (extractedEmails.length > 0) {
        setSelectedEmails(prev => {
          const combined = [...prev, ...extractedEmails];
          return [...new Set(combined)];
        });
        setRecipients('');
      }
    }
  }, [recipients]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const removeEmail = (emailToRemove) => {
    setSelectedEmails(prev => prev.filter(email => email !== emailToRemove));
  };

  const clearAllEmails = () => {
    setSelectedEmails([]);
    setRecipients('');
  };

  const copyEmailsToClipboard = () => {
    navigator.clipboard.writeText(selectedEmails.join(', '));
    setStatus({ type: 'success', message: 'Emails copied to clipboard!' });
    setTimeout(() => setStatus(null), 2000);
  };

  const validateForm = () => {
    if (selectedEmails.length === 0) {
      setStatus({ type: 'error', message: 'Please add at least one email address' });
      return false;
    }

    if (!subject.trim()) {
      setStatus({ type: 'error', message: 'Please enter a subject' });
      return false;
    }

    if (!message.trim()) {
      setStatus({ type: 'error', message: 'Please write a message' });
      return false;
    }

    return true;
  };

  const sendEmail = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setStatus(null);

    try {
      const apiKey = import.meta.env.VITE_BREVO_API_KEY;
      const fromEmail = import.meta.env.VITE_BREVO_FROM_EMAIL;
      const fromName = import.meta.env.VITE_BREVO_FROM_NAME;

      if (!apiKey || !fromEmail || !fromName) {
        throw new Error('Missing environment variables. Please check your .env file.');
      }

      const toRecipients = selectedEmails.map(email => ({ email }));

      const requestBody = {
        sender: {
          name: fromName,
          email: fromEmail
        },
        to: toRecipients,
        subject: subject,
        htmlContent: emailType === 'html' ? `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 80px rgba(0,0,0,0.2);">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 40px; text-align: center; position: relative;">
                <h1 style="color: white; margin: 0; font-size: 36px; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">${subject}</h1>
              </div>
              <div style="padding: 50px 40px; background: linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%);">
                <div style="color: #2d3748; line-height: 1.8; font-size: 17px; white-space: pre-wrap;">${message}</div>
              </div>
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <p style="margin: 0; color: white; font-size: 14px; font-weight: 600;">Sent with Noor Mailer</p>
              </div>
            </div>
          </div>
        ` : undefined,
        textContent: emailType === 'text' ? message : undefined
      };

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: `${emailType === 'html' ? 'HTML' : 'Text'} email sent successfully to ${selectedEmails.length} recipient${selectedEmails.length > 1 ? 's' : ''}!`
        });

        setTimeout(() => {
          setSelectedEmails([]);
          setSubject('');
          setMessage('');
          setStatus(null);
        }, 3000);
      } else {
        throw new Error(data.message || 'Failed to send email');
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const HTMLPreview = () => (
    <div
      dangerouslySetInnerHTML={{
        __html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 80px rgba(0,0,0,0.2);">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">${subject || 'Your Subject Here'}</h1>
              </div>
              <div style="padding: 50px 40px; background: linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%);">
                <div style="color: #2d3748; line-height: 1.8; font-size: 17px; white-space: pre-wrap;">${message || 'Your message will appear here...'}</div>
              </div>
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <p style="margin: 0; color: white; font-size: 14px; font-weight: 600;">Sent with Noor Mailer</p>
              </div>
            </div>
          </div>
        `
      }}
    />
  );

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Advanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
        {/* Mesh Gradient Overlay */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/30 animate-pulse-slow"></div>
        </div>

        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-float-slow"></div>
        <div className="absolute bottom-40 right-1/4 w-64 h-64 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-float"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

        {/* Sparkle Effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-3xl blur-2xl opacity-60 animate-pulse-slow"></div>
            <div className="relative inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl shadow-2xl transform hover:scale-110 transition-all duration-500">
              <Mail className="w-16 h-16 text-white" />
              <div className="absolute -top-2 -right-2">
                <Star className="w-8 h-8 text-yellow-300 animate-spin-slow" />
              </div>
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl animate-gradient">
            Noor Mailer
          </h1>

          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            <p className="text-white/90 text-xl sm:text-2xl font-semibold">
              Send stunning emails with elegance
            </p>
            <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <div className="px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl text-white font-bold hover:bg-white/20 transition-all transform hover:scale-105">
              Lightning Fast
            </div>
            <div className="px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl text-white font-bold hover:bg-white/20 transition-all transform hover:scale-105">
              Beautiful Templates
            </div>
            <div className="px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl text-white font-bold hover:bg-white/20 transition-all transform hover:scale-105">
              Multi-Recipient
            </div>
          </div>
        </div>

        {/* Main Card - Glassmorphism */}
        <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8 sm:p-10 lg:p-14">
            {/* Email Type Selector */}
            <div className="mb-12">
              <label className="flex items-center text-white font-black text-2xl mb-6 gap-3">
                <Zap className="w-7 h-7 text-yellow-300" />
                Email Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button
                  onClick={() => setEmailType('text')}
                  className={`group p-8 rounded-3xl border-3 transition-all transform hover:scale-105 ${emailType === 'text'
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-300 shadow-2xl scale-105'
                    : 'bg-white/5 backdrop-blur-xl border-white/20 hover:bg-white/10'
                    }`}
                >
                  <FileText className={`w-12 h-12 mx-auto mb-4 ${emailType === 'text' ? 'text-white' : 'text-cyan-300'}`} />
                  <h3 className={`font-black text-xl mb-2 ${emailType === 'text' ? 'text-white' : 'text-white/90'}`}>Plain Text</h3>
                  <p className={`text-sm ${emailType === 'text' ? 'text-white/90' : 'text-white/60'}`}>
                    Simple & Clean
                  </p>
                </button>
                <button
                  onClick={() => setEmailType('html')}
                  className={`group p-8 rounded-3xl border-3 transition-all transform hover:scale-105 ${emailType === 'html'
                    ? 'bg-gradient-to-br from-purple-500 to-pink-600 border-purple-300 shadow-2xl scale-105'
                    : 'bg-white/5 backdrop-blur-xl border-white/20 hover:bg-white/10'
                    }`}
                >
                  <Code className={`w-12 h-12 mx-auto mb-4 ${emailType === 'html' ? 'text-white' : 'text-purple-300'}`} />
                  <h3 className={`font-black text-xl mb-2 ${emailType === 'html' ? 'text-white' : 'text-white/90'}`}>HTML Design</h3>
                  <p className={`text-sm ${emailType === 'html' ? 'text-white/90' : 'text-white/60'}`}>
                    Beautiful & Styled
                  </p>
                </button>
              </div>
            </div>

            {/* Recipients */}
            <div className="mb-12">
              <label className="flex items-center text-white font-black text-2xl mb-6">
                <Users className="w-7 h-7 mr-3 text-purple-300" />
                Recipients
              </label>

              <div className="relative">
                <textarea
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Paste multiple emails here (comma, space, or line separated)..."
                  className="w-full px-8 py-6 border-3 border-white/30 rounded-3xl bg-white/5 backdrop-blur-xl text-lg text-white resize-none outline-none transition-all focus:border-purple-400 focus:ring-4 focus:ring-purple-400/50 placeholder-white/40"
                  rows={3}
                />
                <div className="absolute top-5 right-5 bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2 rounded-2xl text-white font-bold text-sm shadow-xl">
                  Paste Here
                </div>
              </div>

              {selectedEmails.length > 0 && (
                <div className="mt-8 p-8 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border-3 border-emerald-400/50 rounded-3xl shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                    <span className="text-xl font-black text-emerald-200 flex items-center gap-3">
                      <CheckCircle className="w-6 h-6" />
                      {selectedEmails.length} Email{selectedEmails.length > 1 ? 's' : ''} Ready
                    </span>
                    <div className="flex gap-4">
                      <button
                        onClick={copyEmailsToClipboard}
                        className="px-5 py-3 bg-white/20 backdrop-blur-xl border-2 border-white/30 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-white/30 transition-all transform hover:scale-105"
                      >
                        <Copy className="w-5 h-5" />
                        Copy
                      </button>
                      <button
                        onClick={clearAllEmails}
                        className="px-5 py-3 bg-red-500/20 backdrop-blur-xl border-2 border-red-400/30 text-red-200 rounded-2xl font-bold flex items-center gap-2 hover:bg-red-500/30 transition-all transform hover:scale-105"
                      >
                        <Trash2 className="w-5 h-5" />
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 max-h-72 overflow-y-auto custom-scrollbar">
                    {selectedEmails.map((email, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-3 px-6 py-4 bg-white/10 backdrop-blur-xl border-2 border-emerald-300/50 rounded-2xl text-sm font-bold text-white shadow-lg hover:bg-white/20 transition-all"
                      >
                        <span className="text-emerald-300 text-lg">✓</span>
                        <span>{email}</span>
                        <button
                          onClick={() => removeEmail(email)}
                          className="text-red-300 hover:text-red-400 transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="mb-12">
              <label className="flex items-center text-white font-black text-2xl mb-6">
                <Mail className="w-7 h-7 mr-3 text-blue-300" />
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's your email about?"
                className="w-full px-8 py-6 border-3 border-white/30 rounded-3xl text-xl text-white font-semibold bg-white/5 backdrop-blur-xl outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-400/50 shadow-lg placeholder-white/40"
              />
            </div>

            {/* Message */}
            <div className="mb-12">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <label className="flex items-center text-white font-black text-2xl">
                  {emailType === 'html' ? (
                    <Code className="w-7 h-7 mr-3 text-pink-300" />
                  ) : (
                    <FileText className="w-7 h-7 mr-3 text-cyan-300" />
                  )}
                  Your Message
                </label>
                {emailType === 'html' && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-5 py-3 bg-purple-500/30 backdrop-blur-xl text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-purple-500/40 transition-all border-2 border-purple-400/50"
                  >
                    <Eye className="w-5 h-5" />
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </button>
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={emailType === 'html' ? 'Write your message... It will be beautifully formatted!' : 'Write your plain text message here...'}
                className="w-full px-8 py-6 border-3 border-white/30 rounded-3xl text-lg text-white resize-none min-h-[300px] bg-white/5 backdrop-blur-xl outline-none transition-all focus:border-pink-400 focus:ring-4 focus:ring-pink-400/50 font-mono shadow-lg placeholder-white/40"
              />
              <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-sm text-white/80 font-semibold">
                <span>{message.length} characters • {message.split('\n').length} lines</span>
                <span className={`px-4 py-2 rounded-full font-bold ${emailType === 'html' ? 'bg-purple-500/30 text-purple-200' : 'bg-blue-500/30 text-blue-200'}`}>
                  {emailType === 'html' ? 'HTML Mode' : 'Text Mode'}
                </span>
              </div>

              {showPreview && emailType === 'html' && message && (
                <div className="mt-8 p-8 bg-white/5 backdrop-blur-xl border-3 border-white/20 rounded-3xl">
                  <h4 className="font-black text-xl mb-6 text-white flex items-center gap-2">
                    <Eye className="w-6 h-6" />
                    Email Preview:
                  </h4>
                  <div className="bg-white rounded-2xl p-8 shadow-2xl max-h-96 overflow-y-auto custom-scrollbar">
                    <HTMLPreview />
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            {status && (
              <div className={`mb-10 p-8 rounded-3xl flex items-center gap-5 border-3 ${status.type === 'success'
                ? 'border-emerald-400/50 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-xl text-emerald-100'
                : 'border-red-400/50 bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-xl text-red-100'
                } shadow-2xl`}>
                {status.type === 'success' ? (
                  <CheckCircle className="w-10 h-10 flex-shrink-0" />
                ) : (
                  <XCircle className="w-10 h-10 flex-shrink-0" />
                )}
                <span className="font-black text-xl">{status.message}</span>
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={sendEmail}
              disabled={loading || selectedEmails.length === 0}
              className={`w-full py-8 px-12 rounded-3xl font-black text-white text-2xl flex items-center justify-center gap-5 border-none transition-all transform ${loading || selectedEmails.length === 0
                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 shadow-2xl hover:scale-105 hover:shadow-purple-500/50 cursor-pointer'
                }`}
            >
              {loading ? (
                <>
                  <Loader className="w-10 h-10 animate-spin" />
                  Sending Email...
                </>
              ) : (
                <>
                  <Send className="w-10 h-10" />
                  Send to {selectedEmails.length} Recipient{selectedEmails.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-xl p-10 border-t-3 border-white/20 text-center">
            <p className="text-white font-bold text-lg mb-3">
              Quick Tips
            </p>
            <p className="text-white/70 text-sm">
              Paste from Excel, CSV, or any text • Auto-validates emails • Removes duplicates
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-white font-bold text-xl mb-3">
            Powered by <span className="bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent">Noor's API</span>
          </p>
          <p className="text-white/60 text-sm">
            Built with React + Vite • Made with love for seamless email sending
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(5deg); }
          66% { transform: translate(-20px, 20px) rotate(-5deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-40px, 30px) rotate(-7deg); }
          66% { transform: translate(30px, -20px) rotate(7deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, 20px) scale(1.1); }
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 10s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 12s ease-in-out infinite; }
        .animate-sparkle { animation: sparkle 3s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
                .animate-spin-slow { animation: spin-slow 10s linear infinite; }
        .animate-gradient { 
          background-size: 200% 200%; 
          animation: gradient 8s ease infinite; 
        }
      `}</style>
    </div>
  );
}
