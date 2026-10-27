export function SectionHeading({
  eyebrow,
  title,
  description,
  as: Heading = 'h2',
  className = 'max-w-xl',
  titleClassName = 'text-3xl font-normal tracking-[-0.03em] text-text-primary sm:text-4xl',
  descriptionClassName = 'mt-4 text-sm leading-6 text-text-secondary sm:text-base',
}) {
  return (
    <div className={className}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}

      <Heading
        className={`${eyebrow ? 'mt-4' : ''} ${titleClassName}`}
      >
        {title}
      </Heading>

      {description && (
        <p className={descriptionClassName}>{description}</p>
      )}
    </div>
  );
}

export default SectionHeading;