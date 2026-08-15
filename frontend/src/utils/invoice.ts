export const generateUpiQrUrl = (amount: number) => {
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || "flavourbase@sbi";
  const payeeName = process.env.NEXT_PUBLIC_UPI_PAYEE_NAME || "Flavour Base India";

  const upiParams = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount.toFixed(2), // fixed amount, prevents payer from editing
    cu: "INR",
  });

  const upiUri = `upi://pay?${upiParams.toString()}`;

  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUri)}`;
};