<template>
  <div class="empty-state">
    <div class="icon">📄</div>
    <h2>Welcome to Askfolio</h2>
    <p>Upload documents and ask questions about them in a chat session.</p>
    <ol class="steps">
      <li>Upload a document using <strong>＋</strong> in the sidebar</li>
      <li>Create a new chat with <strong>＋</strong> next to Chats</li>
      <li>Link documents to your chat using <strong>○</strong></li>
      <li>Ask away!</li>
    </ol>
  </div>
</template>

<style scoped>
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
  gap: 14px;
}

.icon { font-size: 48px; }

h2 { font-size: 20px; font-weight: 600; color: var(--text); }

p { max-width: 360px; line-height: 1.6; }

.steps {
  list-style: decimal;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 20px 16px 36px;
}

.steps li { font-size: 13px; }
.steps strong { color: var(--text); }
</style>
