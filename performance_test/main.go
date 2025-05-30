package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"sync"
	"time"
)

const (
	graphqlURL = "http://34.96.244.61:4000/graphql" // Updated backend URL
	numUsers   = 1000
)

type User struct {
	Username  string
	Password  string
	Email     string
	Phone     string
	FirstName string
	LastName  string
}

type GraphQLRequest struct {
	Query     string                 `json:"query"`
	Variables map[string]interface{} `json:"variables"`
}

type GraphQLResponse struct {
	Data   map[string]interface{} `json:"data"`
	Errors []struct {
		Message string `json:"message"`
	} `json:"errors"`
}

type TestResult struct {
	Operation string
	Success   bool
	Duration  time.Duration
	Error     string
}

func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}

func generateUser() User {
	return User{
		Username:  "user_" + randomString(8),
		Password:  randomString(12),
		Email:     randomString(8) + "@example.com",
		Phone:     randomString(10),
		FirstName: randomString(6),
		LastName:  randomString(8),
	}
}

func sendGraphQLRequest(query string, variables map[string]interface{}) (*GraphQLResponse, error) {
	reqBody := GraphQLRequest{
		Query:     query,
		Variables: variables,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	resp, err := http.Post(graphqlURL, "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result GraphQLResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}

func signUp(user User) TestResult {
	start := time.Now()

	query := `
		mutation SignUp($userInput: UserSignUp!) {
			signUp(userInput: $userInput) {
				token
				user {
					id
					username
				}
			}
		}
	`

	variables := map[string]interface{}{
		"userInput": user,
	}

	result, err := sendGraphQLRequest(query, variables)
	duration := time.Since(start)

	if err != nil {
		return TestResult{
			Operation: "signup",
			Success:   false,
			Duration:  duration,
			Error:     err.Error(),
		}
	}

	if len(result.Errors) > 0 {
		return TestResult{
			Operation: "signup",
			Success:   false,
			Duration:  duration,
			Error:     result.Errors[0].Message,
		}
	}

	return TestResult{
		Operation: "signup",
		Success:   true,
		Duration:  duration,
	}
}

func login(user User) TestResult {
	start := time.Now()

	query := `
		mutation Login($userInput: UserLogIn!) {
			logIn(userInput: $userInput) {
				token
				user {
					id
					username
				}
			}
		}
	`

	variables := map[string]interface{}{
		"userInput": map[string]string{
			"username": user.Username,
			"password": user.Password,
		},
	}

	result, err := sendGraphQLRequest(query, variables)
	duration := time.Since(start)

	if err != nil {
		return TestResult{
			Operation: "login",
			Success:   false,
			Duration:  duration,
			Error:     err.Error(),
		}
	}

	if len(result.Errors) > 0 {
		return TestResult{
			Operation: "login",
			Success:   false,
			Duration:  duration,
			Error:     result.Errors[0].Message,
		}
	}

	return TestResult{
		Operation: "login",
		Success:   true,
		Duration:  duration,
	}
}

func main() {
	rand.Seed(time.Now().UnixNano())

	// Generate test users
	users := make([]User, numUsers)
	for i := 0; i < numUsers; i++ {
		users[i] = generateUser()
	}

	// Create channels for results
	signupResults := make(chan TestResult, numUsers)
	loginResults := make(chan TestResult, numUsers)

	// Create wait group for synchronization
	var wg sync.WaitGroup

	// Start signup test
	fmt.Println("Starting signup test...")
	startTime := time.Now()
	for _, user := range users {
		wg.Add(1)
		go func(u User) {
			defer wg.Done()
			result := signUp(u)
			signupResults <- result
		}(user)
	}

	// Wait for all signups to complete
	wg.Wait()
	close(signupResults)
	signupDuration := time.Since(startTime)

	// Process signup results
	var successfulSignups int
	var totalSignupDuration time.Duration
	for result := range signupResults {
		if result.Success {
			successfulSignups++
		}
		totalSignupDuration += result.Duration
	}

	// Start login test
	fmt.Println("Starting login test...")
	startTime = time.Now()
	for _, user := range users {
		wg.Add(1)
		go func(u User) {
			defer wg.Done()
			result := login(u)
			loginResults <- result
		}(user)
	}

	// Wait for all logins to complete
	wg.Wait()
	close(loginResults)
	loginDuration := time.Since(startTime)

	// Process login results
	var successfulLogins int
	var totalLoginDuration time.Duration
	for result := range loginResults {
		if result.Success {
			successfulLogins++
		}
		totalLoginDuration += result.Duration
	}

	// Print results
	fmt.Printf("\nPerformance Test Results:\n")
	fmt.Printf("Total Users: %d\n\n", numUsers)

	fmt.Printf("Signup Test:\n")
	fmt.Printf("Total Duration: %v\n", signupDuration)
	fmt.Printf("Successful Signups: %d\n", successfulSignups)
	fmt.Printf("Failed Signups: %d\n", numUsers-successfulSignups)
	fmt.Printf("Average Signup Duration: %v\n\n", totalSignupDuration/time.Duration(numUsers))

	fmt.Printf("Login Test:\n")
	fmt.Printf("Total Duration: %v\n", loginDuration)
	fmt.Printf("Successful Logins: %d\n", successfulLogins)
	fmt.Printf("Failed Logins: %d\n", numUsers-successfulLogins)
	fmt.Printf("Average Login Duration: %v\n", totalLoginDuration/time.Duration(numUsers))
}
