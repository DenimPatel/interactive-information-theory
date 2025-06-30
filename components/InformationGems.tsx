
import React from 'react';
import Card from './Card';

interface GemItemProps {
  title: string;
  children: React.ReactNode;
}

const GemItem: React.FC<GemItemProps> = ({ title, children }) => (
  <div className="mb-4 p-4 bg-sky-50/70 border border-sky-200 rounded-lg shadow">
    <h4 className="text-lg font-semibold text-sky-700 mb-2">{title}</h4>
    <div className="text-sm text-slate-700 leading-relaxed space-y-1">{children}</div>
  </div>
);

const InformationGems: React.FC = () => {
  return (
    <Card title="Key Gems of Information Theory" className="mt-8 bg-white">
      <section className="mb-6">
        <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-4 border-b pb-2 border-slate-300">
          Foundational Concepts
        </h3>
        <GemItem title="Information as Surprise">
          <p>Information theory quantifies information based on the unexpectedness of an event. The less likely an event is, the more surprising and informative it is when it occurs.</p>
        </GemItem>
        <GemItem title="Entropy">
          <p>This measures the uncertainty or "missing information" in a random variable. Higher entropy means greater uncertainty about the variable's possible outcomes. Shannon entropy, a specific form of entropy, quantifies the average amount of information produced by a source.</p>
        </GemItem>
        <GemItem title="Mutual Information">
          <p>This measure quantifies the shared information or dependency between two random variables. It can be used to describe their correlation or how much knowing one variable tells you about the other.</p>
        </GemItem>
      </section>

      <section className="mb-6">
        <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-4 border-b pb-2 border-slate-300">
          Important Results (Shannon's Theorems)
        </h3>
        <GemItem title="Shannon's Source Coding Theorem">
          <p>This sets the theoretical limit on how much data can be compressed from a given source without loss of information, based on its entropy.</p>
        </GemItem>
        <GemItem title="Shannon's Channel Coding Theorem">
          <p>This establishes the maximum rate at which information can be transmitted reliably over a noisy communication channel, given the channel's capacity.</p>
        </GemItem>
      </section>

      <section>
        <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-4 border-b pb-2 border-slate-300">
          Applications (Real-World "Gems")
        </h3>
        <GemItem title="Data Compression">
          <p>Information theory underpins algorithms like JPEG and MPEG for compressing images and videos, reducing file sizes for efficient storage and transmission.</p>
        </GemItem>
        <GemItem title="Error Correction">
          <p>Error-correcting codes, based on information theory, are used to detect and correct errors that occur during data transmission, ensuring data integrity.</p>
        </GemItem>
        <GemItem title="Cryptography">
          <p>Information theory helps quantify encryption strength and analyze vulnerabilities in cryptographic systems, aiding in the design of secure encryption algorithms.</p>
        </GemItem>
        <GemItem title="Machine Learning">
          <p>Concepts like information gain are crucial for feature selection and building decision trees in machine learning algorithms, helping to improve model performance.</p>
        </GemItem>
      </section>
    </Card>
  );
};

export default InformationGems;
