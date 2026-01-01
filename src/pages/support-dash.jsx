import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../components/sidebar";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";

export default function SupportDash() {
  const [activeTab, setActiveTab] = useState("inbox");
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "support_threads"), orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setThreads(data);
    });
    return () => unsub();
  }, []);

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        <h1 style={styles.title}>Support Messages</h1>

        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab("inbox")}
            style={tabStyle(activeTab === "inbox")}
          >
            Inbox
          </button>
          <button
            onClick={() => setActiveTab("newMessage")}
            style={tabStyle(activeTab === "newMessage")}
          >
            New Message
          </button>
        </div>

        {activeTab === "inbox" ? (
          <InboxView
            threads={threads}
            selectedThread={selectedThread}
            setSelectedThread={setSelectedThread}
          />
        ) : (
          <NewMessageView setActiveTab={setActiveTab} />
        )}
      </main>
    </div>
  );
}

/* ---------------- Inbox View ---------------- */
const InboxView = ({ threads, selectedThread, setSelectedThread }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const chatBottomRef = useRef(null);
  // Selected attachment for preview
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  // Ref to the textarea for blur handling
  const inputRef = useRef(null);
  // Track the last time the sender viewed this conversation so we can show seen indicators
  const [senderLastSeenAt, setSenderLastSeenAt] = useState(null);

  // Map of user IDs to their latest profile info (fullName/name/email). This
  // allows the inbox list to update names in real time when a sender or driver
  // updates their profile.
  const [userInfo, setUserInfo] = useState({});

  // Listen to both senders and drivers collections to keep user info up to date
  useEffect(() => {
    const unsubSenders = onSnapshot(collection(db, 'senders'), (snap) => {
      setUserInfo((prev) => {
        const info = { ...prev };
        snap.docs.forEach((docSnap) => {
          info[docSnap.id] = { ...info[docSnap.id], ...docSnap.data() };
        });
        return info;
      });
    });
    const unsubDrivers = onSnapshot(collection(db, 'drivers'), (snap) => {
      setUserInfo((prev) => {
        const info = { ...prev };
        snap.docs.forEach((docSnap) => {
          info[docSnap.id] = { ...info[docSnap.id], ...docSnap.data() };
        });
        return info;
      });
    });
    return () => {
      unsubSenders();
      unsubDrivers();
    };
  }, []);

  useEffect(() => {
    if (!selectedThread) return;
    const q = query(
      collection(db, "support_threads", selectedThread.id, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(data);
    });
    return () => unsub();
  }, [selectedThread]);

  // Subscribe to the sender's copy of this thread to know when they last viewed messages.
  useEffect(() => {
    if (!selectedThread) return;
    // If there is no targetId, we cannot listen to sender thread
    if (!selectedThread.targetId) return;
    const senderThreadDoc = doc(
      db,
      "senders",
      selectedThread.targetId,
      "support_threads",
      selectedThread.id
    );
    const unsub = onSnapshot(senderThreadDoc, (snap) => {
      const data = snap.data();
      if (data && data.lastSeenAt) {
        setSenderLastSeenAt(data.lastSeenAt);
      } else {
        setSenderLastSeenAt(null);
      }
    });
    return () => unsub();
  }, [selectedThread]);

  // Mark thread as read when selected
  useEffect(() => {
    if (!selectedThread) return;
    const markAsRead = async () => {
      try {
        await updateDoc(
          doc(
            db,
            "senders",
            selectedThread.targetId,
            "support_threads",
            selectedThread.id
          ),
          {
            isRead: true,
            lastSeenAt: serverTimestamp(),
          }
        );
        // Also mark the support thread as read and update lastSeenAt. This helps us know which threads still have unread messages.
        await updateDoc(doc(db, "support_threads", selectedThread.id), {
          isRead: true,
          lastSeenAt: serverTimestamp(),
        });
      } catch (err) {
        // ignore
      }
    };
    markAsRead();
  }, [selectedThread]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    // avoid sending empty messages or without a selected thread
    if (!selectedThread || !messageText.trim()) return;

    const text = messageText.trim();
    const now = serverTimestamp();

    // Reference to the admin side of the conversation
    const supportMsgRef = collection(
      db,
      "support_threads",
      selectedThread.id,
      "messages"
    );

    // Write the message in the support (admin) thread
    await addDoc(supportMsgRef, {
      senderId: "support_admin",
      senderType: "support",
      text,
      createdAt: now,
    });

    // Update the admin thread metadata
    await setDoc(
      doc(db, "support_threads", selectedThread.id),
      { lastMessage: text, updatedAt: now },
      { merge: true }
    );

    // Also replicate the message in the sender's copy so they can read it
    // The sender's copy is stored under "senders/{targetId}/support_threads/{threadId}"
    const senderThreadRef = doc(
      db,
      "senders",
      selectedThread.targetId,
      "support_threads",
      selectedThread.id
    );
    const senderMsgRef = collection(
      db,
      "senders",
      selectedThread.targetId,
      "support_threads",
      selectedThread.id,
      "messages"
    );

    // Add the message to the sender's messages collection
    await addDoc(senderMsgRef, {
      from: "support",
      text,
      attachments: [],
      timestamp: now,
    });

    // Update metadata on the sender thread to reflect the new message
    await updateDoc(senderThreadRef, {
      lastMessage: text,
      lastTimestamp: now,
      isRead: false,
    }).catch(async () => {
      // If update fails because the document doesn't exist (older threads), create it
      await setDoc(
        senderThreadRef,
        {
          subject: selectedThread.subject || "No subject",
          lastMessage: text,
          lastTimestamp: now,
          senderId: selectedThread.targetId,
          isRead: false,
        },
        { merge: true }
      );
    });

    // clear the input field
    setMessageText("");
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return "";
    return new Date(timestamp.seconds * 1000).toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div
      style={inboxStyles.wrapper}
      onClick={(e) => {
        // blur the input if click is outside the textarea
        if (inputRef.current && !inputRef.current.contains(e.target)) {
          inputRef.current.blur();
        }
      }}
    >
      {/* Bloc gauche */}
      <div style={inboxStyles.sidebar}>
        {threads.length === 0 ? (
          <p style={styles.noData}>No messages yet.</p>
        ) : (
          threads.map((t) => {
            const u = userInfo[t.targetId] || {};
            const displayName = u.fullName || u.name || t.targetName || 'Unnamed';
            const displayEmail = u.email || t.targetEmail || '';
            return (
              <div
                key={t.id}
                onClick={() => setSelectedThread(t)}
                style={{
                  ...inboxStyles.threadItem,
                  backgroundColor: selectedThread?.id === t.id ? '#EDE9FE' : '#fff',
                  position: 'relative',
                }}
              >
                {/* Name */}
                <strong style={{ display: 'block' }}>{displayName}</strong>
                {/* Email */}
                <p style={inboxStyles.email}>{displayEmail}</p>
                {/* Date */}
                {t.updatedAt && (
                  <p style={inboxStyles.date}>{formatDate(t.updatedAt)}</p>
                )}
                {/* Subject displayed below the date */}
                <p
                  style={{
                    marginTop: 4,
                    fontWeight: 600,
                    color: '#5B21B6',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {t.subject || 'No subject'}
                </p>
                {/* Preview of last message. We separate the unread indicator
                    from this row and instead position it in the bottom
                    right corner of the item to make it stand out. */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: 4,
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: '#6B7280',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {t.lastMessage || ''}
                  </span>
                </div>
                {/* Unread indicator: small green dot positioned at the bottom-right
                    of the thread item. This appears only when the thread has
                    unread messages. */}
                {t.isRead === false && (
                  <span
                    style={{
                      position: 'absolute',
                      right: 10,
                      bottom: 8,
                      width: 10,
                      height: 10,
                      backgroundColor: '#10B981',
                      borderRadius: '50%',
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bloc droite */}
      <div style={inboxStyles.detail}>
        {!selectedThread ? (
          <p style={styles.noData}>Select a conversation to view details.</p>
        ) : (
          <>
            {/* En-tête */}
            <div style={inboxStyles.detailHeader}>
              {selectedThread.targetPhoto ||
              selectedThread.photoUrl ||
              selectedThread.photoURL ||
              selectedThread.profileImage ? (
                <img
                  src={
                    selectedThread.targetPhoto ||
                    selectedThread.photoUrl ||
                    selectedThread.photoURL ||
                    selectedThread.profileImage
                  }
                  alt="Profile"
                  style={inboxStyles.avatar}
                />
              ) : (
                <div style={inboxStyles.avatarPlaceholder}>
                  {selectedThread.targetName
                    ? selectedThread.targetName[0].toUpperCase()
                    : "?"}
                </div>
              )}

              <h3 style={inboxStyles.subjectHeader}>
                {selectedThread.subject || "No subject"}
              </h3>
              <p style={inboxStyles.userName}>{selectedThread.targetName}</p>
              <p style={inboxStyles.role}>
                {selectedThread.targetRole || "Driver"}
              </p>
              <p style={inboxStyles.userEmail}>
                {selectedThread.targetEmail || ""}
              </p>
            </div>

            {/* Messages */}
            <div style={inboxStyles.messagesContainer}>
              {messages.map((m) => {
                const isSupport = m.senderType === "support";
                const attachments = m.attachments || [];
                const isImage = (url) => {
                  const ext = url.split(".").pop().toLowerCase();
                  return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
                };
                return (
                  <div
                    key={m.id}
                    style={isSupport ? inboxStyles.msgBubbleRight : inboxStyles.msgBubbleLeft}
                  >
                    {m.text && (
                      <p style={inboxStyles.messageText}>{m.text}</p>
                    )}
                    {attachments.length > 0 && (
                      <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                        {attachments.map((url, idx) => (
                          <div
                            key={idx}
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              setSelectedAttachment({
                                url,
                                type: isImage(url) ? "image" : "pdf",
                              })
                            }
                          >
                            {isImage(url) ? (
                              <img
                                src={url}
                                alt="attachment"
                                style={{ maxWidth: 120, maxHeight: 80, borderRadius: 4, display: "block" }}
                              />
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span role="img" aria-label="pdf" style={{ fontSize: 18 }}>
                                  📄
                                </span>
                                <span
                                  style={{
                                    textDecoration: "underline",
                                    color: isSupport ? "#4B5563" : "#4B5563",
                                  }}
                                >
                                  {url.split("/").pop().split("?")[0]}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <span style={inboxStyles.timestamp}>{formatDate(m.createdAt)}</span>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
              {/* Display a 'Seen' indicator when the last support message has been viewed by the sender */}
              {(() => {
                // Find the last message sent by support
                let lastSupportMsg = null;
                for (let i = messages.length - 1; i >= 0; i--) {
                  const msg = messages[i];
                  if (msg.senderType === "support") {
                    lastSupportMsg = msg;
                    break;
                  }
                }
                if (
                  lastSupportMsg &&
                  senderLastSeenAt &&
                  senderLastSeenAt.seconds &&
                  lastSupportMsg.createdAt &&
                  lastSupportMsg.createdAt.seconds
                ) {
                  if (senderLastSeenAt.seconds > lastSupportMsg.createdAt.seconds) {
                    const date = new Date(senderLastSeenAt.seconds * 1000);
                    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          marginTop: 4,
                          marginRight: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: '#6B7280',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          ✔ Seen {timeString}
                        </span>
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </div>

            {/* Zone de saisie */}
            <div style={inboxStyles.inputArea}>
              <textarea
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                style={inboxStyles.input}
                ref={inputRef}
              />
              <button onClick={sendMessage} style={inboxStyles.sendBtn}>
                Send
              </button>
            </div>
          </>
        )}
      </div>

      {/* Preview panel */}
      <div style={inboxStyles.preview}>
        {selectedAttachment ? (
          <div style={{ position: "relative", height: "100%", width: "100%" }}>
            <button
              onClick={() => setSelectedAttachment(null)}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "rgba(0,0,0,0.1)",
                border: "none",
                borderRadius: "50%",
                width: 24,
                height: 24,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
            {selectedAttachment.type === "image" ? (
              <img
                src={selectedAttachment.url}
                alt="Preview"
                // Display a smaller preview image. Limit its size to 80% of the panel's width and height so
                // it doesn't fill the entire panel, while keeping the aspect ratio and rounding the corners.
                style={{
                  width: "300px",
                  height: "auto",
                  maxHeight: "300px",
                  objectFit: "contain",
                  borderRadius: 8,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
              />
            ) : (
              <iframe
                src={selectedAttachment.url}
                title="Document Preview"
                width="100%"
                height="100%"
                style={{ border: "none" }}
              />
            )}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#9CA3AF",
              fontStyle: "italic",
              padding: 16,
              textAlign: "center",
            }}
          >
            Select an attachment to preview
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- New Message ---------------- */
const NewMessageView = ({ setActiveTab }) => {
  const [drivers, setDrivers] = useState([]);
  const [senders, setSenders] = useState([]);
  const [target, setTarget] = useState("");
  const [targetName, setTargetName] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [targetPhoto, setTargetPhoto] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  // state for filtering driver and sender lists
  const [searchDriver, setSearchDriver] = useState("");
  const [searchSender, setSearchSender] = useState("");

  useEffect(() => {
    const unsubDrivers = onSnapshot(collection(db, "drivers"), (snap) =>
      setDrivers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubSenders = onSnapshot(collection(db, "senders"), (snap) =>
      setSenders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubDrivers();
      unsubSenders();
    };
  }, []);

  const startMessage = async () => {
    // Ensure a recipient, subject and message are selected
    if (!target || !message.trim() || !subject.trim()) return;

    // Create a new thread for the support side
    const threadRef = doc(collection(db, "support_threads"));

    // Use a concrete Date instead of serverTimestamp so the thread and message
    // show up immediately in client-side listeners that order by timestamp.
    const nowDate = new Date();

    // Write the support thread metadata. Mark isRead as true because no
    // incoming messages exist yet for the support admin.
    await setDoc(threadRef, {
      targetId: target,
      targetName,
      targetEmail,
      targetPhoto,
      targetRole,
      subject,
      participants: ["support_admin", target],
      lastMessage: message.trim(),
      updatedAt: nowDate,
      isRead: true,
    });

    // Write the first message in the support thread
    await addDoc(collection(threadRef, "messages"), {
      senderId: "support_admin",
      senderType: "support",
      text: message.trim(),
      createdAt: nowDate,
      attachments: [],
    });

    // Mirror the thread into the sender's subcollection. This allows the
    // recipient to see the conversation immediately in their inbox. Use the
    // same thread ID so both sides stay synchronized. Mark isRead false to
    // indicate there are unread messages from support.
    const senderThreadRef = doc(db, "senders", target, "support_threads", threadRef.id);
    await setDoc(
      senderThreadRef,
      {
        subject: subject,
        lastMessage: message.trim(),
        lastTimestamp: nowDate,
        senderId: target,
        isRead: false,
      },
      { merge: true }
    );

    // Write the first message in the sender's copy
    await addDoc(collection(senderThreadRef, "messages"), {
      from: "support",
      text: message.trim(),
      attachments: [],
      timestamp: nowDate,
    });

    // Switch back to inbox after creating the thread
    setActiveTab("inbox");
  };

  return (
    // Constrain the width of the new message composer so it doesn't stretch across the entire page.
    <div
      style={{
        display: "flex",
        gap: 24,
        width: "100%",
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
      {/* Left column: subject and message inputs */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Display selected recipient */}
        <div style={{ marginBottom: 6 }}>
          <label style={{ fontWeight: 600 }}>Recipient:</label>
          <div
            style={{
              padding: "10px",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              backgroundColor: targetName ? "#ECFEFF" : "#F9FAFB",
              color: targetName ? "#047857" : "#6B7280",
              fontSize: 15,
            }}
          >
            {targetName ? `${targetName} (${targetEmail})` : "Select a recipient from the list"}
          </div>
        </div>
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={emailStyles.input}
        />
        <textarea
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={emailStyles.textarea}
        />
        <button onClick={startMessage} style={emailStyles.sendBtn}>
          Send Message
        </button>
      </div>
      {/* Right column: recipient selection panel. Expand to fill remaining space while maintaining a minimum width */}
      <div
        style={{
          flex: 1,
          minWidth: 320,
          maxWidth: 400,
          maxHeight: 600,
          overflowY: "auto",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 8,
          padding: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <h3 style={{ marginBottom: 10, fontSize: 18, fontWeight: 700 }}>Select Recipient</h3>
        {/* Drivers section */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 16, fontWeight: 600, color: "#5B21B6" }}>Drivers</h4>
          <input
            type="text"
            placeholder="Search drivers..."
            value={searchDriver}
            onChange={(e) => setSearchDriver(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              marginTop: 6,
              marginBottom: 8,
              borderRadius: 6,
              border: "1px solid #E5E7EB",
            }}
          />
          <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #E5E7EB", borderRadius: 6 }}>
            {drivers
              .filter((d) => {
                const term = searchDriver.toLowerCase();
                const name = (d.fullName || d.name || "").toLowerCase();
                const email = (d.email || "").toLowerCase();
                const state = (d.state || d.addressState || "").toLowerCase();
                const city = (d.city || d.addressCity || "").toLowerCase();
                return (
                  name.includes(term) ||
                  email.includes(term) ||
                  state.includes(term) ||
                  city.includes(term)
                );
              })
              .sort((a, b) => (a.fullName || a.name || "").localeCompare(b.fullName || b.name || ""))
              .map((d) => (
                <div
                  key={d.id}
                  onClick={() => {
                    setTarget(d.id);
                    setTargetName(d.fullName || d.name || "Unnamed");
                    setTargetEmail(d.email || "");
                    setTargetPhoto(d.photoUrl || d.photoURL || "");
                    setTargetRole("Driver");
                  }}
                  style={{
                    padding: "8px 10px",
                    cursor: "pointer",
                    borderBottom: "1px solid #F3F4F6",
                    backgroundColor: target === d.id ? "#EDE9FE" : "#FFFFFF",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{d.fullName || d.name || "Unnamed"}</div>
                  <div style={{ fontSize: 13, color: "#6B7280" }}>{d.email || ""}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>{(d.state || d.addressState || "") + (d.city || d.addressCity ? ", " + (d.city || d.addressCity) : "")}</div>
                </div>
              ))}
          </div>
        </div>
        {/* Senders section */}
        <div>
          <h4 style={{ fontSize: 16, fontWeight: 600, color: "#5B21B6" }}>Senders</h4>
          <input
            type="text"
            placeholder="Search senders..."
            value={searchSender}
            onChange={(e) => setSearchSender(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              marginTop: 6,
              marginBottom: 8,
              borderRadius: 6,
              border: "1px solid #E5E7EB",
            }}
          />
          <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #E5E7EB", borderRadius: 6 }}>
            {senders
              .filter((s) => {
                const term = searchSender.toLowerCase();
                const name = (s.fullName || s.name || "").toLowerCase();
                const email = (s.email || "").toLowerCase();
                const state = (s.state || s.addressState || "").toLowerCase();
                const city = (s.city || s.addressCity || "").toLowerCase();
                return (
                  name.includes(term) ||
                  email.includes(term) ||
                  state.includes(term) ||
                  city.includes(term)
                );
              })
              .sort((a, b) => (a.fullName || a.name || "").localeCompare(b.fullName || b.name || ""))
              .map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setTarget(s.id);
                    setTargetName(s.fullName || s.name || "Unnamed");
                    setTargetEmail(s.email || "");
                    setTargetPhoto(s.photoUrl || s.photoURL || "");
                    setTargetRole("Sender");
                  }}
                  style={{
                    padding: "8px 10px",
                    cursor: "pointer",
                    borderBottom: "1px solid #F3F4F6",
                    backgroundColor: target === s.id ? "#EDE9FE" : "#FFFFFF",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{s.fullName || s.name || "Unnamed"}</div>
                  <div style={{ fontSize: 13, color: "#6B7280" }}>{s.email || ""}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>{(s.state || s.addressState || "") + (s.city || s.addressCity ? ", " + (s.city || s.addressCity) : "")}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Styles ---------------- */
const tabStyle = (active) => ({
  padding: "10px 24px",
  marginRight: 10,
  backgroundColor: active ? "#5B21B6" : "#E5E7EB",
  color: active ? "#fff" : "#374151",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
});

const styles = {
  // Container uses flex to align main content next to the fixed sidebar
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#F9FAFB",
  },
  // Main area: offset to the right of the sidebar and fill the remaining viewport width.
  main: {
    flexGrow: 1,
    padding: 32,
    marginTop: 30,
    marginLeft: "var(--sidebar-width)",
    width: "calc(100vw - var(--sidebar-width))",
    transition: "margin-left 0.3s ease",
    overflowX: "hidden",
    overflowY: "auto",
  },
  title: { fontSize: 26, fontWeight: 700, marginBottom: 20 },
  tabs: { display: "flex", gap: 10, marginBottom: 20 },
  noData: { color: "#9CA3AF", fontStyle: "italic", textAlign: "center" },
};

const inboxStyles = {
  wrapper: {
    display: "grid",
    // Allocate more width to the preview panel so attachments are easier to view
    gridTemplateColumns: "25% 35% 40%",
    gap: 20,
    height: 700,
  },
  sidebar: {
    backgroundColor: "#fff",
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    // Always show vertical scrollbar to prevent width from shifting when switching threads
    overflowY: "scroll",
    overflowX: "hidden",
    padding: 16,
    flexShrink: 0,
  },
  threadItem: {
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    cursor: "pointer",
    marginBottom: 10,
    transition: "background 0.2s",
    // Allow rows to grow slightly to accommodate subject and preview while maintaining a minimum height
    minHeight: 110,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    // Provide some internal spacing
    padding: 12,
    // Hide overflowed content to avoid growing rows when text wraps
    overflow: "hidden",
  },
  subject: {
    fontWeight: 700,
    color: "#5B21B6",
    marginBottom: 4,
    // Keep the subject on a single line and truncate overflow with an ellipsis to avoid row height changes
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  email: { fontStyle: "italic", color: "#6B7280", marginTop: 2, fontSize: 13 },
  date: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  detail: {
    backgroundColor: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    // Ensure the scroll bar is always present to avoid width changes when content overflows
    overflowY: "scroll",
    overflowX: "hidden",
    flexShrink: 0,
    zIndex: 1000,
  },
  preview: {
    backgroundColor: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: 16,
    border: "3px solid red",
    // Show scroll bar consistently
    height: "100%",
  overflowY: "auto",
  overflowX: "hidden",
  textAlign: "center",
  },
  detailHeader: {
    textAlign: "center",
    borderBottom: "1px solid #E5E7EB",
    paddingBottom: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: "50%",
    objectFit: "cover",
    margin: "auto",
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: "50%",
    backgroundColor: "#E5E7EB",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 36,
    color: "#4B5563",
    margin: "auto",
  },
  subjectHeader: {
    fontWeight: 700,
    color: "#5B21B6",
    marginTop: 10,
    fontSize: 18,
  },
  userName: { fontWeight: 600, marginTop: 4 },
  role: { color: "#6B7280", fontSize: 13 },
  userEmail: { fontStyle: "italic", color: "#6B7280" },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  msgBubbleLeft: {
    backgroundColor: "#F3F4F6",
    color: "#111827",
    alignSelf: "flex-start",
    padding: 12,
    borderRadius: 10,
    width: "70%",
    boxShadow: "0px 1px 2px rgba(0,0,0,0.1)",
    wordBreak: "break-word",
  },
  msgBubbleRight: {
    backgroundColor: "#E5E7EB",
    color: "#111827",
    alignSelf: "flex-end",
    padding: 12,
    borderRadius: 10,
    width: "70%",
    boxShadow: "0px 1px 2px rgba(0,0,0,0.1)",
    wordBreak: "break-word",
  },
  messageText: { margin: 0, fontSize: 14, lineHeight: 1.4 },
  timestamp: { fontSize: 11, marginTop: 4, color: "#9CA3AF", display: "block" },
  inputArea: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    borderTop: "1px solid #E5E7EB",
    paddingTop: 8,
  },
  input: {
    flex: 1,
    minHeight: 45,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #E5E7EB",
    fontSize: 14,
    resize: "none",
  },
  sendBtn: {
    backgroundColor: "#5B21B6",
    color: "#fff",
    padding: "8px 18px",
    borderRadius: 8,
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
  },
};

const emailStyles = {
  form: { display: "flex", flexDirection: "column", gap: 14, maxWidth: 700 },
  input: {
    padding: 12,
    borderRadius: 8,
    border: "1px solid #E5E7EB",
    fontSize: 15,
  },
  textarea: {
    minHeight: 160,
    padding: 12,
    borderRadius: 8,
    border: "1px solid #E5E7EB",
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: "#5B21B6",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
    alignSelf: "flex-start",
  },
};
