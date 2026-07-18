import {
	Button,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	Card,
	CardBody,
	Notice,
	Spinner,
	TextControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { Icon, wordpress } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import type { ReactNode } from 'react';
import {
	clearFrappeConnection,
	getFrappeConnection,
	loginWithPassword,
	logoutPasswordSession,
	saveFrappeConnection,
	validateFrappeConnection,
} from '../auth';

type Props = {
	isChecking?: boolean;
	onAuthenticated?: () => Promise< void > | void;
	onDisconnected?: () => void;
};

export function ConnectionView( {
	isChecking = false,
	onAuthenticated,
	onDisconnected,
}: Props ) {
	const initialConnection = getFrappeConnection();
	const [ siteUrl, setSiteUrl ] = useState( initialConnection.siteUrl );
	const [ mode, setMode ] = useState< 'password' | 'token' >(
		initialConnection.hasToken && ! initialConnection.hasSession
			? 'token'
			: 'password'
	);
	const [ username, setUsername ] = useState( '' );
	const [ password, setPassword ] = useState( '' );
	const [ apiKey, setApiKey ] = useState( '' );
	const [ apiSecret, setApiSecret ] = useState( '' );
	const [ hasToken, setHasToken ] = useState( initialConnection.hasToken );
	const [ hasSession, setHasSession ] = useState(
		initialConnection.hasSession
	);
	const [ isConfigLocked ] = useState( initialConnection.isConfigLocked );
	const [ isBusy, setBusy ] = useState( false );
	const [ message, setMessage ] = useState< string >();

	async function connect() {
		setBusy( true );
		setMessage( undefined );
		try {
			if ( mode === 'password' ) {
				const settings = await loginWithPassword(
					siteUrl,
					username,
					password,
					isConfigLocked
				);
				setHasSession( settings.hasSession );
				setPassword( '' );
			} else if ( ! isConfigLocked ) {
				const settings = await saveFrappeConnection(
					siteUrl,
					apiKey,
					apiSecret
				);
				setHasToken( settings.hasToken );
			}
			await validateFrappeConnection();
			setApiKey( '' );
			setApiSecret( '' );
			await onAuthenticated?.();
		} catch ( error ) {
			setMessage(
				error instanceof Error ? error.message : String( error )
			);
		} finally {
			setBusy( false );
		}
	}

	async function disconnect() {
		setBusy( true );
		setMessage( undefined );
		try {
			if ( isConfigLocked ) {
				await logoutPasswordSession();
			} else {
				await clearFrappeConnection();
			}
			setHasToken( false );
			setHasSession( false );
			onDisconnected?.();
		} catch ( error ) {
			setMessage(
				error instanceof Error ? error.message : String( error )
			);
		} finally {
			setBusy( false );
		}
	}

	const checking = isChecking;
	let credentialFields: ReactNode = null;
	if ( mode === 'password' ) {
		credentialFields = (
			<>
				<TextControl
					label={ __( 'Username', 'wpui-frappe-plugin-starter' ) }
					value={ username }
					onChange={ setUsername }
					required
					__next40pxDefaultSize
				/>
				<TextControl
					label={ __( 'Password', 'wpui-frappe-plugin-starter' ) }
					type="password"
					value={ password }
					onChange={ setPassword }
					required
					__next40pxDefaultSize
				/>
			</>
		);
	} else if ( ! isConfigLocked ) {
		credentialFields = (
			<>
				<TextControl
					label={ __( 'API key', 'wpui-frappe-plugin-starter' ) }
					value={ apiKey }
					onChange={ setApiKey }
					required={ ! hasToken }
					__next40pxDefaultSize
				/>
				<TextControl
					label={ __( 'API secret', 'wpui-frappe-plugin-starter' ) }
					type="password"
					value={ apiSecret }
					onChange={ setApiSecret }
					required={ ! hasToken }
					help={
						hasToken
							? __(
									'Leave blank to keep the saved token.',
									'wpui-frappe-plugin-starter'
							  )
							: undefined
					}
					__next40pxDefaultSize
				/>
			</>
		);
	}

	let submitLabel: string = __(
		'Save and connect',
		'wpui-frappe-plugin-starter'
	);
	if ( mode === 'password' ) {
		submitLabel = hasSession
			? __( 'Sign in again', 'wpui-frappe-plugin-starter' )
			: __( 'Sign in', 'wpui-frappe-plugin-starter' );
	} else if ( hasToken || isConfigLocked ) {
		submitLabel = __( 'Verify connection', 'wpui-frappe-plugin-starter' );
	}

	return (
		<div className="frappe-connection-screen">
			<Card className="frappe-connection-card" elevation={ 2 }>
				<CardBody
					className="frappe-connection-card-body"
					aria-live="polite"
				>
					<div className="frappe-connection-brand">
						<Icon icon={ wordpress } size={ 40 } />
						<div>
							<strong>
								{ __(
									'WP Frappe Data Store',
									'wpui-frappe-plugin-starter'
								) }
							</strong>
							<span>
								{ __(
									'WordPress Plugin Integration',
									'wpui-frappe-plugin-starter'
								) }
							</span>
						</div>
					</div>
					{ checking ? (
						<div className="frappe-connection-checking">
							<Spinner />
							<p>
								{ __(
									'Checking the Frappe CRM connection…',
									'wpui-frappe-plugin-starter'
								) }
							</p>
						</div>
					) : (
						<>
							<h1>
								{ __(
									'Connect to Frappe CRM',
									'wpui-frappe-plugin-starter'
								) }
							</h1>
							<p className="frappe-modal-intro">
								{ __(
									'Choose a Frappe login or API token. Credentials and sessions remain server-side.',
									'wpui-frappe-plugin-starter'
								) }
							</p>
							{ message && (
								<Notice status="error" isDismissible={ false }>
									{ message }
								</Notice>
							) }
							<form
								onSubmit={ ( event ) => {
									event.preventDefault();
									void connect();
								} }
							>
								<TextControl
									label={ __(
										'Frappe site URL',
										'wpui-frappe-plugin-starter'
									) }
									type="url"
									value={ siteUrl }
									onChange={ setSiteUrl }
									disabled={ isConfigLocked }
									help={ __(
										'Use the HTTPS origin only, without a path.',
										'wpui-frappe-plugin-starter'
									) }
									required
									__next40pxDefaultSize
								/>
								<ToggleGroupControl
									label={ __(
										'Authentication method',
										'wpui-frappe-plugin-starter'
									) }
									hideLabelFromVision
									value={ mode }
									onChange={ ( value ) => setMode( value as 'password' | 'token' ) }
									isBlock
									__next40pxDefaultSize
								>
									<ToggleGroupControlOption
										value="password"
										label={ __(
											'Login',
											'wpui-frappe-plugin-starter'
										) }
									/>
									<ToggleGroupControlOption
										value="token"
										label={ __(
											'API token',
											'wpui-frappe-plugin-starter'
										) }
									/>
								</ToggleGroupControl>
								{ credentialFields }
								<div className="frappe-modal-actions">
									<Button
										variant="primary"
										type="submit"
										isBusy={ isBusy }
									>
										{ submitLabel }
									</Button>
									{ ( hasToken || hasSession ) &&
										( ! isConfigLocked || hasSession ) && (
											<Button
												variant="tertiary"
												isDestructive
												onClick={ () =>
													void disconnect()
												}
												disabled={ isBusy }
											>
												{ __(
													'Disconnect',
													'wpui-frappe-plugin-starter'
												) }
											</Button>
										) }
								</div>
							</form>
						</>
					) }
				</CardBody>
			</Card>
		</div>
	);
}
