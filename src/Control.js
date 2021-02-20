import PropTypes from "prop-types";
import React from "react";

const Control = ({ forID, value, onChange, classNameWrapper, field }) => {
  const handleChange = (v) => {
    // const shouldStoreImages = field.get("storeImages");
    onChange(v)
  };

  return (
    <textarea
      rows={20}
      id={forID}
      className={classNameWrapper}
      value={value || ""}
      onChange={(e) => handleChange(e.target.value)}
    />
  );
};

Control.propTypes = {
  onChange: PropTypes.func.isRequired,
  forID: PropTypes.string,
  value: PropTypes.node,
  classNameWrapper: PropTypes.string.isRequired,
};

Control.defaultProps = {
  value: "",
};

export default Control;
