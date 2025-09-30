import {
	WhopCheckoutEmbed,
	useCheckoutEmbedControls,
} from "@whop/checkout/react";
import React from "react";

function App() {
	const embedRef = useCheckoutEmbedControls();

	const handleComplete = (plan_id: string, receipt_id?: string) => {
		console.log("Checkout completed!", { plan_id, receipt_id });
	};

	const handleStateChange = (state: string) => {
		console.log("Checkout state changed:", state);
	};

	const handleSetEmail = async () => {
		try {
			await embedRef.current?.setEmail("test@example.com");
			console.log("Email set successfully!");
		} catch (error) {
			console.error("Failed to set email:", error);
		}
	};

	const handleGetEmail = async () => {
		try {
			const email = await embedRef.current?.getEmail();
			console.log("Current email:", email);
		} catch (error) {
			console.error("Failed to get email:", error);
		}
	};

	const handleSubmitCheckout = () => {
		embedRef.current?.submit();
		console.log("Checkout submitted programmatically!");
	};

	return (
		<div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
			<h1>Whop Checkout Embed - React 18 Test</h1>

			<div style={{ marginBottom: "20px" }}>
				<h2>Controls</h2>
				<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
					<button type="button" onClick={handleSetEmail} style={buttonStyle}>
						Set Test Email
					</button>
					<button type="button" onClick={handleGetEmail} style={buttonStyle}>
						Get Current Email
					</button>
					<button
						type="button"
						onClick={handleSubmitCheckout}
						style={buttonStyle}
					>
						Submit Checkout
					</button>
				</div>
			</div>

			<div style={{ marginBottom: "20px" }}>
				<h2>Checkout Embed</h2>
				<div
					style={{
						border: "2px solid #ddd",
						borderRadius: "8px",
						overflow: "hidden",
						width: "100%",
						height: "fit-content",
					}}
				>
					<WhopCheckoutEmbed
						ref={embedRef}
						planId="plan_kGbI6jLMfgIAB"
						onComplete={handleComplete}
						onStateChange={handleStateChange}
						theme="light"
						themeOptions={{ accentColor: "gray", highContrast: true }}
						styles={{
							container: {
								paddingY: "20px",
							},
						}}
					/>
				</div>
			</div>

			<div style={{ marginTop: "20px" }}>
				<h2>Test Information</h2>
				<ul>
					<li>
						<strong>React Version:</strong> {React.version}
					</li>
					<li>
						<strong>Purpose:</strong> Test @whop/checkout React component with
						React 18
					</li>
					<li>
						<strong>Features:</strong> Ref forwarding, controls, event handling
					</li>
				</ul>
			</div>
		</div>
	);
}

const buttonStyle: React.CSSProperties = {
	padding: "8px 16px",
	backgroundColor: "#007bff",
	color: "white",
	border: "none",
	borderRadius: "4px",
	cursor: "pointer",
	fontSize: "14px",
};

export default App;
