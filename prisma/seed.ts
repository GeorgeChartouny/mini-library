import "dotenv/config";
import { prisma } from "../lib/prisma";

const books = [
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "978-0-7432-7356-5",
    category: "Fiction",
    publishedYear: 1925,
    description:
      "A story of decadence and the American Dream set in the Jazz Age.",
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "978-0-06-112008-4",
    category: "Fiction",
    publishedYear: 1960,
  },
  {
    title: "1984",
    author: "George Orwell",
    isbn: "978-0-452-28423-4",
    category: "Science Fiction",
    publishedYear: 1949,
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "978-0-14-143951-8",
    category: "Romance",
    publishedYear: 1813,
  },
  {
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    category: "Fiction",
    publishedYear: 1951,
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "978-0-13-235088-4",
    category: "Technology",
    publishedYear: 2008,
  },
  {
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    isbn: "978-1-4493-7332-0",
    category: "Technology",
    publishedYear: 2017,
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "978-0-547-92822-7",
    category: "Fantasy",
    publishedYear: 1937,
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    category: "Science Fiction",
    publishedYear: 1965,
  },
  {
    title: "The Pragmatic Programmer",
    author: "David Thomas, Andrew Hunt",
    isbn: "978-0-13-595705-9",
    category: "Technology",
    publishedYear: 2019,
  },
];

async function main() {
  await prisma.loan.deleteMany();
  await prisma.book.deleteMany();
  const created = await Promise.all(
    books.map((b) =>
      prisma.book.create({
        data: {
          title: b.title,
          author: b.author,
          isbn: (b as { isbn?: string }).isbn ?? undefined,
          category: (b as { category?: string }).category ?? undefined,
          publishedYear: (b as { publishedYear?: number }).publishedYear ?? undefined,
          description: (b as { description?: string }).description ?? undefined,
        },
      })
    )
  );
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // Active loan (due in 7 days)
  if (created[0]) {
    await prisma.loan.create({
      data: {
        bookId: created[0].id,
        borrowerName: "Alice",
        borrowerEmail: "alice@example.com",
        borrowerPhone: "+1-555-0100",
        dueAt: new Date(now + 7 * day),
      },
    });
  }
  // Returned loan (past)
  if (created[1]) {
    await prisma.loan.create({
      data: {
        bookId: created[1].id,
        borrowerName: "Bob",
        borrowerEmail: "bob@example.com",
        borrowedAt: new Date(now - 14 * day),
        returnedAt: new Date(now - 7 * day),
      },
    });
  }
  // Overdue: due 5 days ago
  if (created[2]) {
    await prisma.loan.create({
      data: {
        bookId: created[2].id,
        borrowerName: "Carol",
        borrowerEmail: "carol@example.com",
        borrowerPhone: "+1-555-0102",
        borrowedAt: new Date(now - 14 * day),
        dueAt: new Date(now - 5 * day),
      },
    });
  }
  // Overdue: due 2 days ago
  if (created[3]) {
    await prisma.loan.create({
      data: {
        bookId: created[3].id,
        borrowerName: "Dave",
        borrowerEmail: "dave@example.com",
        borrowerPhone: "+1-555-0103",
        borrowedAt: new Date(now - 10 * day),
        dueAt: new Date(now - 2 * day),
      },
    });
  }
  console.log("Seed completed: created", created.length, "books");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());