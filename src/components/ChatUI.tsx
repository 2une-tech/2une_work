'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/services/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ChatUIProps {
  applicationId: string;
  questions: { id: string; question: string }[];
}

interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
}

/** Build API transcript: assistant questions + user answers in order. */
function buildTranscript(messages: Message[]) {
  const transcript: Array<{ role: 'assistant' | 'user'; content: string }> = [];
  for (const m of messages) {
    if (m.role === 'bot') {
      transcript.push({ role: 'assistant', content: m.text });
    } else {
      transcript.push({ role: 'user', content: m.text });
    }
  }
  return transcript;
}

export default function ChatUI({ applicationId, questions }: ChatUIProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (questions.length === 0) {
      toast.error('No interview questions available.');
      return;
    }
    simulateBotMessage(
      questionIndex === 0 ? questions[0].question : questions[0]?.question ?? '',
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial greeting only
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const simulateBotMessage = (text: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: `${Date.now()}-b`, role: 'bot', text }]);
      setIsTyping(false);
    }, 800);
  };

  const handleSend = async () => {
    if (!inputVal.trim() || isTyping || isFinished) return;

    const newMsg: Message = { id: `${Date.now()}-u`, role: 'user', text: inputVal.trim() };
    const nextMessages = [...messages, newMsg];
    setMessages(nextMessages);
    setInputVal('');

    const nextQ = questionIndex + 1;
    setQuestionIndex(nextQ);

    if (nextQ < questions.length) {
      simulateBotMessage(questions[nextQ].question);
    } else {
      setIsFinished(true);
      setIsTyping(true);
      try {
        const transcript = buildTranscript(nextMessages);
        if (transcript.length < 1) {
          throw new Error('Empty transcript');
        }
        await api.submitAiInterview(applicationId, transcript);
        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: 'final',
              role: 'bot',
              text: 'Your interview is complete. Redirecting to your dashboard…',
            },
          ]);
          setTimeout(() => router.push('/dashboard'), 2500);
        }, 600);
      } catch (e) {
        setIsTyping(false);
        toast.error(e instanceof Error ? e.message : 'Failed to submit interview');
      }
    }
  };

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-none">
      <div className="flex items-center gap-3 border-b border-border bg-muted/30 p-3">
        <div className="rounded-md border border-border bg-background p-2">
          <Bot className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">2une AI interview</h3>
          <p className="text-xs text-muted-foreground">Answer each question, then send.</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pb-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar className="h-8 w-8 mt-1 border border-border">
                  {msg.role === 'bot' ? (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <Bot className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                  ) : (
                    <>
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div
                  className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted p-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border flex gap-2">
        <Input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Type your answer…"
          disabled={isFinished || isTyping}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void handleSend()}
        />
        <Button size="icon" disabled={isFinished || isTyping || !inputVal.trim()} onClick={() => void handleSend()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
