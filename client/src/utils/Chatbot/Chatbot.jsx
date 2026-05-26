import React, { useState, useRef, useEffect } from 'react';
import styles from './Chatbot.module.scss';
import { requestChatbot } from '../../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { resolveAssetUrl } from '../../lib/assetUrl';

const QUICK_REPLIES = [
    'PC gaming dưới 10 triệu',
    'PC văn phòng',
    'PC RTX 4060',
    'Tư vấn build PC',
];

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: 'Xin chào! Tôi là trợ lý bán hàng. Tôi có thể giúp gì cho bạn?', sender: 'bot' },
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (message) => {
        const userMessage = message.trim();
        if (!userMessage || isLoading) {
            return;
        }

        setMessages((prev) => [...prev, { text: userMessage, sender: 'user' }]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await requestChatbot({ question: userMessage });
            const botMessage = typeof response === 'string'
                ? { text: response, sender: 'bot' }
                : {
                    text: response?.reply || 'Tôi chưa có câu trả lời phù hợp.',
                    sender: 'bot',
                    products: Array.isArray(response?.products) ? response.products : [],
                };

            setMessages((prev) => [...prev, botMessage]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    text: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
                    sender: 'bot',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await sendMessage(inputMessage);
    };

    return (
        <>
            <button className={styles.chatButton} onClick={() => setIsOpen(true)} aria-label="Mở chat">
                <FontAwesomeIcon icon={faComments} />
            </button>

            {isOpen && (
                <div className={styles.chatbotContainer}>
                    <div className={styles.chatHeader}>
                        <h2>Hỗ trợ người dùng</h2>
                        <button className={styles.closeButton} onClick={() => setIsOpen(false)} aria-label="Đóng chat">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                    <div className={styles.messageList}>
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`${styles.message} ${
                                    message.sender === 'user' ? styles.userMessage : styles.botMessage
                                }`}
                            >
                                <div className={styles.messageContent}>{message.text}</div>
                                {message.products?.length > 0 && (
                                    <div className={styles.productSuggestions}>
                                        {message.products.map((product) => (
                                            <Link
                                                key={product.id}
                                                to={`/products/${product.id}`}
                                                className={styles.productSuggestion}
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <img src={resolveAssetUrl(product.image)} alt={product.name} />
                                                <div className={styles.productInfo}>
                                                    <span className={styles.productName}>{product.name}</span>
                                                    <span className={styles.productPrice}>{product.formattedPrice}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className={`${styles.message} ${styles.botMessage}`}>
                                <div className={styles.messageContent}>
                                    <span className={styles.typingIndicator}>Đang nhập...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className={styles.quickReplies}>
                        {QUICK_REPLIES.map((reply) => (
                            <button
                                key={reply}
                                type="button"
                                onClick={() => sendMessage(reply)}
                                disabled={isLoading}
                                className={styles.quickReply}
                            >
                                {reply}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={handleSubmit} className={styles.inputForm}>
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Nhập tin nhắn của bạn..."
                            className={styles.input}
                            disabled={isLoading}
                        />
                        <button type="submit" className={styles.sendButton} disabled={isLoading}>
                            Gửi
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default Chatbot;
