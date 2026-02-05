import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

interface Message {
	sender: "user" | "ai";
	text: string;
}

interface HistoryResponse {
	data: Message[];
}

interface MessageResponse {
	reply: string;
	sessionId: string;
}

interface ChatSession {
	sessionId: string;
	title: string;
	lastMessage: string;
	timestamp: number;
}

const Chat: React.FC = () => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
	const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
	const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

	const bottomRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const generateSessionId = (): string => {
		// Use crypto.randomUUID() for cryptographically secure, guaranteed unique IDs
		// Available in modern browsers (Chrome 92+, Firefox 95+, Safari 15.4+, Edge 92+)
		// Falls back to a timestamp-based method for older browsers (very rare)
		if (
			typeof crypto !== "undefined" &&
			typeof (crypto as Crypto).randomUUID === "function"
		) {
			return (crypto as Crypto).randomUUID();
		}
		// Fallback for older browsers (very rare)
		return `sess_${Date.now()}_${Math.random()
			.toString(36)
			.substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
	};

	const STORAGE_KEY_SESSIONS = "chat_sessions";
	const STORAGE_KEY_CURRENT_SESSION = "chat_current_session_id";

	const loadChatSessions = (): ChatSession[] => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY_SESSIONS);
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	};

	const saveChatSessions = (sessions: ChatSession[]): void => {
		try {
			localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
		} catch (error) {
			console.error("Failed to save chat sessions:", error);
		}
	};

	const updateSessionTitle = (
		sessionIdToUpdate: string,
		title: string,
		lastMessage: string
	): void => {
		const sessions = loadChatSessions();
		const sessionIndex = sessions.findIndex(
			(s) => s.sessionId === sessionIdToUpdate
		);

		if (sessionIndex !== -1) {
			sessions[sessionIndex].title = title;
			sessions[sessionIndex].lastMessage = lastMessage;
			sessions[sessionIndex].timestamp = Date.now();
		} else {
			sessions.push({
				sessionId: sessionIdToUpdate,
				title,
				lastMessage,
				timestamp: Date.now(),
			});
		}

		// Sort by timestamp (newest first)
		sessions.sort((a, b) => b.timestamp - a.timestamp);
		saveChatSessions(sessions);
		setChatSessions(sessions);
	};

	useEffect(() => {
		const sessions = loadChatSessions();
		setChatSessions(sessions);

		let currentSession = localStorage.getItem(STORAGE_KEY_CURRENT_SESSION);
		if (!currentSession && sessions.length > 0) {
			currentSession = sessions[0].sessionId;
		}
		if (!currentSession) {
			currentSession = generateSessionId();
		}

		localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, currentSession);
		setSessionId(currentSession);
	}, []);

	useEffect(() => {
		if (!sessionId) return;

		const fetchHistory = async (): Promise<void> => {
			try {
				const res = await fetch(`${API}/chat/history`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ sessionId }),
				});

				const data: HistoryResponse = await res.json();

				if (Array.isArray(data.data)) {
					setMessages(data.data);

					// Update session in sidebar if messages exist
					if (data.data.length > 0) {
						const firstUserMessage = data.data.find(
							(msg) => msg.sender === "user"
						);
						const lastMessage = data.data[data.data.length - 1];
						const title = firstUserMessage
							? firstUserMessage.text.length > 30
								? firstUserMessage.text.substring(0, 30) + "..."
								: firstUserMessage.text
							: "New Chat";

						updateSessionTitle(sessionId, title, lastMessage.text);
					}
				}
			} catch (err) {
				console.error("History fetch failed", err);
			}
		};

		fetchHistory();
	}, [sessionId]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, loading]);

	const handleNewChat = (): void => {
		const newSessionId = generateSessionId();
		localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, newSessionId);
		setSessionId(newSessionId);
		setMessages([]);
		setInput("");
		setSidebarOpen(false);
		inputRef.current?.focus();
	};

	const handleSelectChat = (selectedSessionId: string): void => {
		if (selectedSessionId === sessionId) {
			setSidebarOpen(false);
			return;
		}
		localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, selectedSessionId);
		setSessionId(selectedSessionId);
		setMessages([]);
		setSidebarOpen(false);
	};

	const handleDeleteChat = (
		sessionIdToDelete: string,
		e: React.MouseEvent
	): void => {
		e.stopPropagation();
		const sessions = loadChatSessions().filter(
			(s) => s.sessionId !== sessionIdToDelete
		);
		saveChatSessions(sessions);
		setChatSessions(sessions);

		if (sessionIdToDelete === sessionId) {
			if (sessions.length > 0) {
				handleSelectChat(sessions[0].sessionId);
			} else {
				handleNewChat();
			}
		}
	};

	const formatTime = (timestamp: number): string => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffInMs = now.getTime() - date.getTime();
		const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

		if (diffInDays === 0) {
			return date.toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
			});
		} else if (diffInDays === 1) {
			return "Yesterday";
		} else if (diffInDays < 7) {
			return date.toLocaleDateString("en-US", { weekday: "short" });
		} else {
			return date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			});
		}
	};

	const sendMessage = async (): Promise<void> => {
		if (!input.trim() || loading || !sessionId) return;

		const userMsg: Message = {
			sender: "user",
			text: input,
		};

		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setLoading(true);

		try {
			const res = await fetch(`${API}/chat/message`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					sessionId,
					message: userMsg.text,
				}),
			});

			const data: MessageResponse = await res.json();

			const aiMsg: Message = {
				sender: "ai",
				text: data.reply || "Something went wrong",
			};

			setMessages((prev) => [...prev, aiMsg]);

			// Update session title with first user message
			if (messages.length === 0) {
				const title =
					userMsg.text.length > 30
						? userMsg.text.substring(0, 30) + "..."
						: userMsg.text;
				updateSessionTitle(sessionId, title, aiMsg.text);
			} else {
				// Update last message
				const sessions = loadChatSessions();
				const sessionIndex = sessions.findIndex(
					(s) => s.sessionId === sessionId
				);
				if (sessionIndex !== -1) {
					updateSessionTitle(
						sessionId,
						sessions[sessionIndex].title,
						aiMsg.text
					);
				}
			}
		} catch (err) {
			setMessages((prev) => [
				...prev,
				{ sender: "ai", text: "Server error. Please try again later." },
			]);
		} finally {
			setLoading(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		setInput(e.target.value);
	};

	return (
		<div className='h-screen custom-gradient-bg flex items-center justify-center p-4'>
			<div className='w-full max-w-6xl h-[95vh] bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 flex overflow-hidden'>
				{/* Sidebar */}
				<div
					className={`${
						sidebarOpen ? "w-80" : "w-0"
					} transition-all duration-300 ease-in-out border-r border-white/20 bg-gray-900/95 backdrop-blur-sm flex flex-col overflow-hidden`}
				>
					<div className='p-4 border-b border-white/20'>
						<div className='flex items-center justify-between mb-4'>
							<h2 className='text-white font-semibold text-lg'>Chat History</h2>
							<button
								onClick={() => setSidebarOpen(false)}
								aria-label='Close sidebar'
								className='p-1 text-white/80 hover:text-white transition-colors'
							>
								<svg
									className='w-5 h-5'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M6 18L18 6M6 6l12 12'
									/>
								</svg>
							</button>
						</div>
						<button
							onClick={handleNewChat}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									handleNewChat();
								}
							}}
							tabIndex={0}
							aria-label='Start new chat session'
							className='w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm backdrop-blur-sm'
						>
							<svg
								className='w-4 h-4'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M12 4v16m8-8H4'
								/>
							</svg>
							New Chat
						</button>
					</div>
					<div className='flex-1 overflow-y-auto p-2'>
						{chatSessions.length === 0 ? (
							<div className='text-center text-white/60 text-sm mt-8'>
								<p>No previous chats</p>
								<p className='text-xs mt-2'>Start a new conversation!</p>
							</div>
						) : (
							<div className='space-y-1'>
								{chatSessions.map((session) => (
									<button
										key={session.sessionId}
										onClick={() => handleSelectChat(session.sessionId)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												handleSelectChat(session.sessionId);
											}
										}}
										tabIndex={0}
										className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
											session.sessionId === sessionId
												? "bg-white/30 border border-white/40"
												: "hover:bg-white/20 border border-transparent"
										}`}
									>
										<div className='flex items-start justify-between gap-2'>
											<div className='flex-1 min-w-0'>
												<p className='text-white font-medium text-sm truncate'>
													{session.title || "New Chat"}
												</p>
												<p className='text-white/70 text-xs truncate mt-1'>
													{session.lastMessage || "No messages yet"}
												</p>
												<p className='text-white/50 text-xs mt-1'>
													{formatTime(session.timestamp)}
												</p>
											</div>
											<div
												onClick={(e) => handleDeleteChat(session.sessionId, e)}
												onKeyDown={(e) => {
													if (e.key === "Enter" || e.key === " ") {
														e.preventDefault();
														handleDeleteChat(
															session.sessionId,
															e as unknown as React.MouseEvent
														);
													}
												}}
												role='button'
												tabIndex={0}
												aria-label='Delete chat'
												className='opacity-0 group-hover:opacity-100 p-1 text-white/60 hover:text-red-300 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded'
											>
												<svg
													className='w-4 h-4'
													fill='none'
													stroke='currentColor'
													viewBox='0 0 24 24'
												>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														strokeWidth={2}
														d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
													/>
												</svg>
											</div>
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Main Chat Area */}
				<div className='flex-1 flex flex-col overflow-hidden'>
					{/* Header */}
					<div className='px-6 py-4 border-b border-white/20 bg-gray-900/90 backdrop-blur-sm'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-3'>
								<button
									onClick={() => setSidebarOpen(!sidebarOpen)}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											setSidebarOpen(!sidebarOpen);
										}
									}}
									tabIndex={0}
									aria-label='Toggle sidebar'
									className='p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all'
								>
									<svg
										className='w-6 h-6'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M4 6h16M4 12h16M4 18h16'
										/>
									</svg>
								</button>
								<div className='w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm'>
									<svg
										className='w-6 h-6 text-white'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'
										aria-hidden='true'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
										/>
									</svg>
								</div>
								<div>
									<h1 className='font-bold text-xl text-white'>
										AI Customer Support
									</h1>
									<p className='text-white/70 text-xs'>Always here to help</p>
								</div>
							</div>
							<button
								onClick={handleNewChat}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handleNewChat();
									}
								}}
								tabIndex={0}
								aria-label='Start new chat session'
								className='flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 font-medium text-sm backdrop-blur-sm'
							>
								<svg
									className='w-4 h-4'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M12 4v16m8-8H4'
									/>
								</svg>
								New Chat
							</button>
						</div>
					</div>

					{/* Messages Container */}
					<div className='flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth'>
						{messages.length === 0 && !loading && (
							<div className='flex flex-col items-center justify-center h-full text-center px-4'>
								<div className='w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm'>
									<svg
										className='w-10 h-10 text-white'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
										/>
									</svg>
								</div>
								<h2 className='text-white font-semibold text-xl mb-2'>
									Welcome to Customer Support! 👋
								</h2>
								<p className='text-white/80 text-sm max-w-md leading-relaxed'>
									I'm your dedicated support assistant, ready to help you with
									any questions or concerns. Whether you need assistance with
									your orders, payment inquiries, refund requests, delivery
									tracking, returns, or account-related issues—I'm here to make
									your experience smooth and hassle-free.
								</p>
								<p className='text-white/60 text-xs mt-3 max-w-md'>
									💡 Tip: Feel free to ask me anything! I'm available 24/7 to
									assist you.
								</p>
							</div>
						)}

						{messages.map((msg, i) => (
							<div
								key={i}
								className={`flex items-start gap-3 ${
									msg.sender === "user" ? "justify-end" : "justify-start"
								}`}
							>
								{msg.sender === "ai" && (
									<div className='w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 shadow-lg backdrop-blur-sm'>
										<svg
											className='w-5 h-5 text-white'
											fill='none'
											stroke='currentColor'
											viewBox='0 0 24 24'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
											/>
										</svg>
									</div>
								)}
								<div
									className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-lg transition-all duration-200 ${
										msg.sender === "user"
											? "bg-white/30 text-white rounded-br-sm backdrop-blur-sm"
											: "bg-white/20 text-white rounded-bl-sm border border-white/30 backdrop-blur-sm"
									}`}
								>
									<p className='text-sm leading-relaxed whitespace-pre-wrap break-words'>
										{msg.text}
									</p>
								</div>
								{msg.sender === "user" && (
									<div className='w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 shadow-lg backdrop-blur-sm'>
										<svg
											className='w-5 h-5 text-white'
											fill='none'
											stroke='currentColor'
											viewBox='0 0 24 24'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
											/>
										</svg>
									</div>
								)}
							</div>
						))}

						{loading && (
							<div className='flex items-start gap-3 justify-start'>
								<div className='w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 shadow-lg backdrop-blur-sm'>
									<svg
										className='w-5 h-5 text-white'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
										/>
									</svg>
								</div>
								<div className='bg-white/20 text-white/80 px-5 py-3 rounded-2xl rounded-bl-sm border border-white/30 shadow-lg backdrop-blur-sm'>
									<div className='flex items-center gap-2'>
										<div className='flex gap-1'>
											<div
												className='w-2 h-2 bg-white/60 rounded-full animate-bounce'
												style={{ animationDelay: "0ms" }}
											></div>
											<div
												className='w-2 h-2 bg-white/60 rounded-full animate-bounce'
												style={{ animationDelay: "150ms" }}
											></div>
											<div
												className='w-2 h-2 bg-white/60 rounded-full animate-bounce'
												style={{ animationDelay: "300ms" }}
											></div>
										</div>
										<span className='text-sm ml-2'>Agent is typing...</span>
									</div>
								</div>
							</div>
						)}

						<div ref={bottomRef} />
					</div>

					{/* Input Container */}
					<div className='px-6 py-4 border-t border-white/20 bg-gray-900/90 backdrop-blur-sm'>
						<div className='flex items-center gap-3'>
							<div className='flex-1 relative'>
								<input
									ref={inputRef}
									type='text'
									value={input}
									onChange={handleInputChange}
									onKeyDown={handleKeyDown}
									placeholder='Type your message...'
									disabled={loading}
									aria-label='Message input'
									className='w-full bg-white/20 text-white px-5 py-3 pr-12 rounded-2xl outline-none border border-white/30 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-200 placeholder-white/50 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm'
								/>
								<button
									onClick={sendMessage}
									disabled={loading || !input.trim()}
									aria-label='Send message'
									className='absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/30 hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 backdrop-blur-sm'
								>
									<Send className='w-5 h-5' />
								</button>
							</div>
						</div>
						<p className='text-xs text-white/50 mt-2 text-center'>
							Press Enter to send
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Chat;
