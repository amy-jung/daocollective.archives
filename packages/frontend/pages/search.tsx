import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetServerSideProps, NextPage } from "next";

interface RecordsProps {
  // ToDo. Define types (swagger on backend?)
  records: any[];
  totalCount: number;
}

const PAGE_SIZE = 10;

const Search: NextPage<RecordsProps> = ({ records, totalCount }) => {
  const router = useRouter();
  const currentPage = Number(router.query.page) || 1;
  const [q, setQ] = useState<string>(router.query.q as string);

  const onSearch = () => {
    router.push(`/search?q=${q}`);
  };

  // Calculate the total number of pages
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Calculate the start and end indexes of the current page
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  const goToPage = (page: number) => {
    router.push(`/records?page=${page}`);
  };

  return (
    <div className="flex flex-col items-center p-8 md:px-24">

      <div className="flex flex-col sm:flex-row w-full mt-12">
        <input
          type="text"
          value={q}
          onChange={value => setQ(value.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter") {
              onSearch();
            }
          }}
          className="grow p-2 px-6 border-2 border-primary"
          placeholder={`Search...`}
        />
        <button
          className="btn btn-primary rounded-none"
          onClick={onSearch}
        >SEARCH</button>
      </div>

      <div className="container mx-auto w-[1150px] max-w-[90%] mt-14">
        <div className="grid md:grid-cols-3 gap-8">
          {records?.map(record => (
            <div key={record.id} className="border-t-base-200 border-t-[10px] py-6">
              <h2 className="text-xl mb-2">
                <Link href={`/records/${record.slug}`}>
                  <span className="font-bold">{record.title}</span>
                </Link>
              </h2>
              <p>
                <span className="italic">{record.organization}</span>
              </p>
              <p className="mt-4">
                <span className="italic" dangerouslySetInnerHTML={{ __html: record.headline }}></span>
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between items-center mt-8 gap-4">
        <button
          className={`btn btn-primary ${currentPage === 1 ? "cursor-not-allowed" : ""}`}
          onClick={() => {
            if (currentPage > 1) {
              goToPage(currentPage - 1);
            }
          }}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        <p className="text-gray-700 flex flex-col gap-2">
          Page {currentPage} of {totalPages}
        </p>

        <button
          className={`btn btn-primary ${currentPage === totalPages ? "cursor-not-allowed" : ""}`}
          onClick={() => {
            if (currentPage < totalPages) {
              goToPage(currentPage + 1);
            }
          }}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async context => {
  const currentPage = Number(context.query.page) || 1;
  const q = context.query.q || "";
  // ToDo. Define types (swagger on backend?)
  let records: any[] = [];
  let totalCount: number = 0;

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/search?q=${q}&page=${currentPage}`);
    if (!res.ok) {
      throw new Error(res.statusText);
    }

    const data = await res.json();
    records = data.records;
    totalCount = data.totalCount;
  } catch (err) {
    console.log(err);
  }

  return {
    props: { records, totalCount },
  };
};

export default Search;