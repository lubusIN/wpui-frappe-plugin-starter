import { Button, Notice, Spinner, TextControl } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { Icon, wordpress } from '@wordpress/icons';
import {
	clearFrappeConnection,
	loadFrappeConnection,
	loginWithPassword,
	logoutPasswordSession,
	saveFrappeConnection,
	validateFrappeConnection,
} from '../auth';

type Props = {
	isChecking?: boolean;
	onAuthenticated?: () => Promise<void> | void;
	onDisconnected?: () => void;
};

export function ConnectionView({
	isChecking = false,
	onAuthenticated,
	onDisconnected,
}: Props) {
	const [siteUrl, setSiteUrl] = useState('');
	const [mode, setMode] = useState<'password' | 'token'>('password');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [apiKey, setApiKey] = useState('');
	const [apiSecret, setApiSecret] = useState('');
	const [hasToken, setHasToken] = useState(false);
	const [hasSession, setHasSession] = useState(false);
	const [isConfigLocked, setConfigLocked] = useState(false);
	const [isLoading, setLoading] = useState(true);
	const [isBusy, setBusy] = useState(false);
	const [message, setMessage] = useState<string>();

	useEffect(() => {
		let current = true;
		void loadFrappeConnection().then(
			(settings) => {
				if (!current) return;
				setSiteUrl(settings.siteUrl);
				setHasToken(settings.hasToken);
				setHasSession(settings.hasSession);
				setMode(settings.hasToken && !settings.hasSession ? 'token' : 'password');
				setConfigLocked(settings.isConfigLocked);
				setLoading(false);
			},
			(error) => {
				if (!current) return;
				setMessage(error instanceof Error ? error.message : String(error));
				setLoading(false);
			}
		);
		return () => {
			current = false;
		};
	}, []);

	async function connect() {
		setBusy(true);
		setMessage(undefined);
		try {
			if (mode === 'password') {
				const settings = await loginWithPassword(
					siteUrl,
					username,
					password,
					isConfigLocked
				);
				setHasSession(settings.hasSession);
				setPassword('');
			} else if (!isConfigLocked) {
				const settings = await saveFrappeConnection(
					siteUrl,
					apiKey,
					apiSecret
				);
				setHasToken(settings.hasToken);
			}
			await validateFrappeConnection();
			setApiKey('');
			setApiSecret('');
			await onAuthenticated?.();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setBusy(false);
		}
	}

	async function disconnect() {
		setBusy(true);
		setMessage(undefined);
		try {
			if (isConfigLocked) {
				await logoutPasswordSession();
			} else {
				await clearFrappeConnection();
			}
			setHasToken(false);
			setHasSession(false);
			onDisconnected?.();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : String(error));
		} finally {
			setBusy(false);
		}
	}

	const checking = isChecking || isLoading;
	return (
		<div className="frappe-connection-screen">
			<section className="frappe-connection-card" aria-live="polite">
				<div className="frappe-connection-brand">
					<Icon icon={wordpress} size={40} />
					<div>
						<strong>WP Frappe Data Store</strong>
						<span>WordPress Plugin Integration</span>
					</div>
				</div>
				{checking ? (
					<div className="frappe-connection-checking">
						<Spinner />
						<p>Checking the Frappe CRM connection…</p>
					</div>
				) : (
					<>
						<h1>Connect to Frappe CRM</h1>
						<p className="frappe-modal-intro">
							Choose a Frappe login or API token. Credentials and sessions remain server-side.
						</p>
						{message && (
							<Notice status="error" isDismissible={false}>
								{message}
							</Notice>
						)}
						<form
							onSubmit={(event) => {
								event.preventDefault();
								void connect();
							}}
						>
							<TextControl
								label="Frappe site URL"
								type="url"
								value={siteUrl}
								onChange={setSiteUrl}
								disabled={isConfigLocked}
								help="Use the HTTPS origin only, without a path."
								required
								__next40pxDefaultSize
								__nextHasNoMarginBottom
							/>
							<div className="frappe-auth-switcher" role="group" aria-label="Authentication method">
								<Button
									variant={mode === 'password' ? 'primary' : 'secondary'}
									onClick={() => setMode('password')}
								>
									Login
								</Button>
								<Button
									variant={mode === 'token' ? 'primary' : 'secondary'}
									onClick={() => setMode('token')}
								>
									API token
								</Button>
							</div>
							{mode === 'password' ? (
								<>
									<TextControl
										label="Username"
										value={username}
										onChange={setUsername}
										required
										__next40pxDefaultSize
										__nextHasNoMarginBottom
									/>
									<TextControl
										label="Password"
										type="password"
										value={password}
										onChange={setPassword}
										required
										__next40pxDefaultSize
										__nextHasNoMarginBottom
									/>
								</>
							) : !isConfigLocked ? (
								<>
									<TextControl
										label="API key"
										value={apiKey}
										onChange={setApiKey}
										required={!hasToken}
										__next40pxDefaultSize
										__nextHasNoMarginBottom
									/>
									<TextControl
										label="API secret"
										type="password"
										value={apiSecret}
										onChange={setApiSecret}
										required={!hasToken}
										help={hasToken ? 'Leave blank to keep the saved token.' : undefined}
										__next40pxDefaultSize
										__nextHasNoMarginBottom
									/>
								</>
							) : null}
							<div className="frappe-modal-actions">
								<Button variant="primary" type="submit" isBusy={isBusy}>
									{mode === 'password'
										? hasSession ? 'Sign in again' : 'Sign in'
										: hasToken || isConfigLocked ? 'Verify connection' : 'Save and connect'}
								</Button>
								{(hasToken || hasSession) && (!isConfigLocked || hasSession) && (
									<Button variant="tertiary" isDestructive onClick={() => void disconnect()} disabled={isBusy}>
										Disconnect
									</Button>
								)}
							</div>
						</form>
					</>
				)}
			</section>
		</div>
	);
}
