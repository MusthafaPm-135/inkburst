function BrandMark({ height = "40px", className = "" }) {
    return (
        <img
            src="/keyra-site-logo.png"
            alt="Keyra Comics"
            className={`brand-mark-logo ${className}`}
            style={{ height: height, width: "auto", display: "block", objectFit: "contain" }} 
        />
    );
}

export default BrandMark;
