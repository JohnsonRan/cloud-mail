import emailUtils from '../utils/email-utils';

// Leave a little room below Telegram's 4096-character message limit.
const TELEGRAM_MESSAGE_LIMIT = 4000;
const TRUNCATED_SUFFIX = '...';
const FIELD_LIMITS = {
	subject: 512,
	name: 256,
	email: 320,
	to: 512
};

function escapeHtml(text = '') {
	return String(text)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function truncateText(text, maxLength) {
	const value = String(text || '');

	if (value.length <= maxLength) {
		return value;
	}

	if (maxLength <= TRUNCATED_SUFFIX.length) {
		return TRUNCATED_SUFFIX.slice(0, maxLength);
	}

	return value.slice(0, maxLength - TRUNCATED_SUFFIX.length) + TRUNCATED_SUFFIX;
}

function code(text, maxLength) {
	const value = truncateText(text, maxLength);
	return value ? `<code>${escapeHtml(value)}</code>` : '';
}

export default function emailMsgTemplate(email, tgMsgTo, tgMsgFrom, tgMsgText) {
	const subject = truncateText(email.subject || '', FIELD_LIMITS.subject);
	const lines = [`📨 <b>${escapeHtml(subject)}</b>`];
	let visibleLength = subject.length + 3;

	if (tgMsgFrom === 'only-name') {
		const name = truncateText(email.name || '', FIELD_LIMITS.name);
		lines.push(`<b>From:</b> ${escapeHtml(name)}`);
		visibleLength += `\n\nFrom: ${name}`.length;
	}

	if (tgMsgFrom === 'show') {
		const name = truncateText(email.name || '', FIELD_LIMITS.name);
		const sender = truncateText(email.sendEmail || '', FIELD_LIMITS.email);
		const senderParts = [escapeHtml(name), code(sender, FIELD_LIMITS.email)].filter(Boolean);
		lines.push(`<b>From:</b> ${senderParts.join(' ')}`);
		visibleLength += `\n\nFrom: ${[name, sender].filter(Boolean).join(' ')}`.length;
	}

	if (tgMsgTo === 'show') {
		const recipient = truncateText(email.toEmail || '', FIELD_LIMITS.to);
		lines.push(`<b>To:</b> ${code(recipient, FIELD_LIMITS.to)}`);
		visibleLength += `\n\nTo: ${recipient}`.length;
	}

	let template = lines.join('\n\n');

	if (tgMsgText === 'show') {
		const text = emailUtils.formatText(email.text) || emailUtils.htmlToText(email.content);
		const separatorLength = 2;
		const maxTextLength = Math.max(0, TELEGRAM_MESSAGE_LIMIT - visibleLength - separatorLength);
		const body = truncateText(text, maxTextLength);

		if (body) {
			template += `\n\n<blockquote expandable>${escapeHtml(body)}</blockquote>`;
		}
	}

	return template;
}
