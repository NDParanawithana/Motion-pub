import React from 'react';
import PageHeader from '../pageHeader/pageHeader';

/**
 * Reusable Sticky Page Heading with Trapezium Container & Pop-up Letters.
 * Wraps the centralized PageHeader component for backwards compatibility.
 */
export default function CornerTitle({
  text = 'MOTION PUB',
  className = '',
  animateKey = 0,
  color,
  textColor,
  containerColor,
  style = {},
  sticky = true,
  trapezium = true,
}) {
  return (
    <PageHeader
      text={text}
      className={className}
      animateKey={animateKey}
      textColor={textColor || color}
      containerColor={containerColor}
      style={style}
      sticky={sticky}
      trapezium={trapezium}
    />
  );
}
