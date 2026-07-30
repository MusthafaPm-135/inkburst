import logoSvg from "../assets/logo.svg";

function BrandMark({ height = "40px", className = "" }) {
    return (
        <img 
            src={logoSvg} 
            alt="KEYRA" 
            className={`brand-mark-logo ${className}`}
            style={{ height: height, width: "auto", display: "block", objectFit: "contain" }} 
        />
    );
}

export default BrandMark;
