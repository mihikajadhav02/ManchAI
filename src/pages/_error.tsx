import { NextPageContext } from 'next';
import React from 'react';

interface ErrorProps {
  statusCode: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

function Error({ statusCode, hasGetInitialPropsRun, err }: ErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          {statusCode ? `Error ${statusCode}` : 'An error occurred'}
        </h1>
        <p className="text-gray-400 mb-8">
          {statusCode === 404
            ? 'This page could not be found.'
            : 'Something went wrong. Please try again.'}
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Home
        </button>
        {err && process.env.NODE_ENV === 'development' && (
          <pre className="mt-8 text-left text-xs bg-gray-900 p-4 rounded overflow-auto max-w-2xl">
            {err.toString()}
          </pre>
        )}
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, hasGetInitialPropsRun: true, err };
};

export default Error;

