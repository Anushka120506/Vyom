import { motion } from "framer-motion";

function RiskCard({
  title,
  value,
  status,
  icon,
}) {
  return (
    <motion.div
      whileHover={{
        scale: 1.03,
      }}
      className="risk-card"
    >
      <div className="risk-card-top">
        <div className="risk-icon">
          {icon}
        </div>

        <h3>{title}</h3>
      </div>

      <div className="risk-card-body">
        <h1>{value}</h1>

        <p>{status}</p>
      </div>
    </motion.div>
  );
}

export default RiskCard;