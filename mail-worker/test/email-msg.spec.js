import { describe, expect, it } from 'vitest';
import emailMsgTemplate from '../src/template/email-msg';

function getVisibleText(message) {
	return message
		.replace(/<[^>]+>/g, '')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

describe('emailMsgTemplate', () => {
	it('renders Telegram HTML with escaped fields and an expandable body', () => {
		const message = emailMsgTemplate({
			subject: 'Build <failed> & retry',
			name: 'CI & Deploy',
			sendEmail: 'ci@example.com',
			toEmail: 'dev@example.com',
			text: 'First line\nSecond <line> & details'
		}, 'show', 'show', 'show');

		expect(message).toContain('📨 <b>Build &lt;failed&gt; &amp; retry</b>');
		expect(message).toContain('<b>From:</b> CI &amp; Deploy <code>ci@example.com</code>');
		expect(message).toContain('<b>To:</b> <code>dev@example.com</code>');
		expect(message).toContain('<blockquote expandable>First line\nSecond &lt;line&gt; &amp; details</blockquote>');
	});

	it('uses HTML email text as a fallback and respects hidden fields', () => {
		const message = emailMsgTemplate({
			subject: 'Welcome',
			name: 'Example',
			sendEmail: 'hello@example.com',
			toEmail: 'user@example.com',
			content: '<p>Hello <strong>there</strong></p><script>ignore me</script>'
		}, 'hide', 'only-name', 'show');

		expect(message).toContain('<b>From:</b> Example');
		expect(message).not.toContain('<b>To:</b>');
		expect(message).not.toContain('<code>hello@example.com</code>');
		expect(message).toContain('<blockquote expandable>Hello there</blockquote>');
		expect(message).not.toContain('ignore me');
	});

	it('keeps the rendered message within the Telegram safety limit', () => {
		const message = emailMsgTemplate({
			subject: 'S'.repeat(1000),
			name: 'N'.repeat(500),
			sendEmail: `${'f'.repeat(500)}@example.com`,
			toEmail: 't'.repeat(1000),
			text: '<&>'.repeat(5000)
		}, 'show', 'show', 'show');
		const visibleText = getVisibleText(message);

		expect(visibleText.length).toBeLessThanOrEqual(4000);
		expect(message).toContain('...</blockquote>');
		expect(message).toContain('&lt;&amp;&gt;');
	});
});
