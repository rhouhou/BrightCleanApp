import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null; // Hide pagination if only one page

  const MAX_VISIBLE_BUTTONS = 3;
  const sideButtons = Math.floor(MAX_VISIBLE_BUTTONS / 2);

  let startPage = Math.max(1, currentPage - sideButtons);
  let endPage = Math.min(totalPages, currentPage + sideButtons);

  if (endPage - startPage + 1 < MAX_VISIBLE_BUTTONS) {
    if (currentPage <= sideButtons) {
      endPage = Math.min(totalPages, startPage + MAX_VISIBLE_BUTTONS - 1);
    } else if (currentPage + sideButtons >= totalPages) {
      startPage = Math.max(1, endPage - MAX_VISIBLE_BUTTONS + 1);
    }
  }

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="mt-4 flex justify-center gap-2">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="button pagination-button"
      >
        {"<<"}
      </button>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="button pagination-button"
      >
        {"<"}
      </button>
      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="button pagination-button"
          >
            1
          </button>
          {startPage > 2 && <span className="pagination-ellipsis">...</span>}
        </>
      )}

      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`button pagination-button ${
            currentPage === page ? "active" : ""
          }`}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="pagination-ellipsis">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="button pagination-button"
          >
            {totalPages}
          </button>
        </>
      )}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="button pagination-button"
      >
        {">"}
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="button pagination-button"
      >
        {">>"}
      </button>
    </div>
  );
};

export default Pagination;
